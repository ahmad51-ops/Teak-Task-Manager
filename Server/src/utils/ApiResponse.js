// Every successful response looks the same: { success, statusCode, data, message }
// A predictable shape means the frontend can write one generic response handler
// instead of guessing the structure per-endpoint.
export class ApiResponse {
  constructor(statusCode, data, message = "Success") {
    this.statusCode = statusCode;
    this.data = data;
    this.message = message;
    this.success = statusCode < 400;
  }
}
