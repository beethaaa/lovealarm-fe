const isObject = (value: any) => value && typeof value === 'object';

const isUserLike = (value: any) =>
  isObject(value) &&
  (value._id || value.id || value.userId) &&
  ('mode' in value ||
    'profile' in value ||
    'username' in value ||
    'email' in value ||
    'name' in value ||
    'avatarUrl' in value);

export const extractUserFromResponse = (response: any) => {
  const candidates = [
    response?.currentUser,
    response?.user,
    response?.data?.currentUser,
    response?.data?.user,
    response?.data?.data?.currentUser,
    response?.data?.data?.user,
    response?.data,
    response,
  ];

  return candidates.find(isUserLike) || null;
};

export const isCoupleMode = (user: any) => Number(user?.mode) === 2;
