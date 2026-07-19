import axios from 'axios';
import {AppState, AppStateStatus} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {SERVER_URL} from '../constants/service';

type EventType = 'screen_view' | 'tap' | 'scroll' | 'text_input';

interface AnalyticsEvent {
  type: EventType;
  screen?: string;
  target?: string;
  timestamp: string;
}

const FLUSH_INTERVAL_MS = 30 * 1000; // 30 seconds
const QUEUE_STORAGE_KEY = 'analytics_event_queue';

class AnalyticsService {
  private eventQueue: AnalyticsEvent[] = [];
  private sessionId: string | null = null;
  private flushTimer: ReturnType<typeof setInterval> | null = null;
  private isSessionActive = false;

  /**
   * Generate a simple UUID v4
   */
  private generateSessionId(): string {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(
      /[xy]/g,
      function (c) {
        const r = (Math.random() * 16) | 0;
        const v = c === 'x' ? r : (r & 0x3) | 0x8;
        return v.toString(16);
      },
    );
  }

  /**
   * Get auth token for API calls
   */
  private async getAuthHeader(): Promise<Record<string, string>> {
    const token = await AsyncStorage.getItem('token');
    return {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    };
  }

  /**
   * Start a new analytics session
   */
  async startSession(): Promise<void> {
    if (this.isSessionActive) {
      return;
    }

    try {
      this.sessionId = this.generateSessionId();
      this.isSessionActive = true;

      const headers = await this.getAuthHeader();

      await axios.post(
        `${SERVER_URL}/api/analytics/session`,
        {
          action: 'start',
          sessionId: this.sessionId,
        },
        {headers, timeout: 10000},
      );

      console.log('[Analytics] Session started:', this.sessionId);

      // Start periodic flush
      this.flushTimer = setInterval(() => {
        this.flushEvents();
      }, FLUSH_INTERVAL_MS);
    } catch (error) {
      console.error('[Analytics] Failed to start session:', error);
      // Still allow local tracking even if API fails
      this.isSessionActive = true;
    }
  }

  /**
   * End the current session
   */
  async endSession(): Promise<void> {
    if (!this.isSessionActive || !this.sessionId) {
      return;
    }

    try {
      // Flush remaining events first
      await this.flushEvents();

      const headers = await this.getAuthHeader();

      await axios.post(
        `${SERVER_URL}/api/analytics/session`,
        {
          action: 'end',
          sessionId: this.sessionId,
        },
        {headers, timeout: 10000},
      );

      console.log('[Analytics] Session ended:', this.sessionId);
    } catch (error) {
      console.error('[Analytics] Failed to end session:', error);
    } finally {
      // Clear timer
      if (this.flushTimer) {
        clearInterval(this.flushTimer);
        this.flushTimer = null;
      }
      this.isSessionActive = false;
      this.sessionId = null;
    }
  }

  /**
   * Track a user event
   */
  trackEvent(
    type: EventType,
    data?: {screen?: string; target?: string},
  ): void {
    if (!this.isSessionActive) {
      return;
    }

    const event: AnalyticsEvent = {
      type,
      screen: data?.screen,
      target: data?.target,
      timestamp: new Date().toISOString(),
    };

    this.eventQueue.push(event);
  }

  /**
   * Flush queued events to the server
   */
  async flushEvents(): Promise<void> {
    if (this.eventQueue.length === 0 || !this.sessionId) {
      return;
    }

    // Take a snapshot and clear queue
    const eventsToSend = [...this.eventQueue];
    this.eventQueue = [];

    try {
      const headers = await this.getAuthHeader();

      await axios.post(
        `${SERVER_URL}/api/analytics/events`,
        {
          sessionId: this.sessionId,
          events: eventsToSend,
        },
        {headers, timeout: 10000},
      );

      console.log(`[Analytics] Flushed ${eventsToSend.length} events`);
    } catch (error) {
      console.error('[Analytics] Failed to flush events, re-queuing:', error);
      // Put events back at the front of the queue
      this.eventQueue = [...eventsToSend, ...this.eventQueue];
    }
  }
}

// Singleton instance
export const analyticsService = new AnalyticsService();
