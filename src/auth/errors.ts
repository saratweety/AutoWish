import { isClerkAPIResponseError } from '@clerk/expo';

/** Clerk's error code, e.g. "form_code_incorrect", if there is one. */
export function clerkErrorCode(error: unknown) {
  return isClerkAPIResponseError(error) ? error.errors[0]?.code : undefined;
}

/** Turns a login error into a short sentence that says what to do. */
export function loginErrorMessage(error: unknown) {
  if (!isClerkAPIResponseError(error)) {
    return "We couldn't reach the login service. Check your internet and try again.";
  }
  switch (clerkErrorCode(error)) {
    case 'form_code_incorrect':
      return "That code didn't work. Check it and try again.";
    case 'verification_expired':
      return 'That code has expired. Tap "Resend code" to get a new one.';
    case 'form_param_format_invalid':
    case 'form_identifier_invalid':
      return 'Please check your email address, e.g. name@gmail.com.';
    case 'too_many_requests':
    case 'verification_failed':
      return 'Too many tries. Please wait a few minutes and try again.';
    default:
      return error.errors[0]?.longMessage ?? error.errors[0]?.message ?? 'Something went wrong. Please try again.';
  }
}
