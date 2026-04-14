export function getFriendlyError(err) {
  const status = err?.response?.status;
  const message = err?.response?.data?.error?.message;

  if (status === 403) {
    return "You don't have permission to do that. Contact your coordinator if you think this is wrong.";
  }

  if (status === 400 && message) {
    return message;
  }

  if (status >= 500) {
    return 'Something went wrong on our end. Please try again.';
  }

  if (!err?.response) {
    return 'No internet connection. Please check your network.';
  }

  return 'An unexpected error occurred. Please try again.';
}
