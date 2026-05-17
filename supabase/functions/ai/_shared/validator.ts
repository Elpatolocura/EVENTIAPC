export interface ValidationResult {
  valid: boolean
  error?: string
}

export function validateImproveTitle(body: any): ValidationResult {
  if (!body.title || typeof body.title !== 'string') {
    return { valid: false, error: 'title is required and must be a string' }
  }
  if (body.title.length > 200) {
    return { valid: false, error: 'title exceeds 200 characters' }
  }
  return { valid: true }
}

export function validateImproveDescription(body: any): ValidationResult {
  if (!body.description || typeof body.description !== 'string') {
    return { valid: false, error: 'description is required and must be a string' }
  }
  if (body.description.length > 2000) {
    return { valid: false, error: 'description exceeds 2000 characters' }
  }
  return { valid: true }
}

export function validateChat(body: any): ValidationResult {
  if (!body.message || typeof body.message !== 'string') {
    return { valid: false, error: 'message is required and must be a string' }
  }
  if (body.message.length > 1000) {
    return { valid: false, error: 'message exceeds 1000 characters' }
  }
  if (body.history && !Array.isArray(body.history)) {
    return { valid: false, error: 'history must be an array' }
  }
  if (body.history && body.history.length > 20) {
    return { valid: false, error: 'history exceeds 20 messages' }
  }
  return { valid: true }
}

export function validateModerate(body: any): ValidationResult {
  if (!body.content || typeof body.content !== 'string') {
    return { valid: false, error: 'content is required and must be a string' }
  }
  if (body.content.length > 5000) {
    return { valid: false, error: 'content exceeds 5000 characters' }
  }
  return { valid: true }
}

export function validateRecommend(body: any): ValidationResult {
  if (body.categories && !Array.isArray(body.categories)) {
    return { valid: false, error: 'categories must be an array' }
  }
  return { valid: true }
}
