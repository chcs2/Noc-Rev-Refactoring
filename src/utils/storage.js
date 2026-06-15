// Wrapper minimalista sobre localStorage, namespaced em "nocrev:".
// Usado pelos contextos para persistir dados sem servidor (protótipo).

const PREFIX = 'nocrev:'

export function load(key, fallback) {
  try {
    const raw = localStorage.getItem(PREFIX + key)
    if (raw == null) return fallback
    return JSON.parse(raw)
  } catch {
    return fallback
  }
}

export function save(key, value) {
  try {
    localStorage.setItem(PREFIX + key, JSON.stringify(value))
  } catch {
    /* quota cheia ou ambiente sem localStorage — silenciar */
  }
}

export function remove(key) {
  try {
    localStorage.removeItem(PREFIX + key)
  } catch {
    /* ignorar */
  }
}

/** Chave per-usuário — todos os dados são particionados por usuário logado. */
export const userScoped = (userId, key) => `user:${userId}:${key}`
