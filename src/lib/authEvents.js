export const AUTH_USER_CHANGED_EVENT = "trip-buddy-auth-changed";

export const dispatchAuthUserChanged = () => {
  window.dispatchEvent(new Event(AUTH_USER_CHANGED_EVENT));
};
