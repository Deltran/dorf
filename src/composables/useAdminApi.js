import { ref } from 'vue'

export function useAdminApi(contentType) {
  const data = ref({})
  const loading = ref(false)
  const error = ref(null)

  async function fetchAll() {
    loading.value = true
    error.value = null
    try {
      const response = await fetch(`/api/admin/${contentType}`)
      if (!response.ok) {
        const err = await response.json()
        throw new Error(err.error || 'Failed to fetch')
      }
      data.value = await response.json()
    } catch (e) {
      error.value = e.message
    } finally {
      loading.value = false
    }
  }

  async function createEntry(entry) {
    loading.value = true
    error.value = null
    try {
      const response = await fetch(`/api/admin/${contentType}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(entry)
      })
      if (!response.ok) {
        const err = await response.json()
        throw new Error(err.error || 'Failed to create')
      }
      const created = await response.json()
      data.value[created.id] = created
      return created
    } catch (e) {
      error.value = e.message
      throw e
    } finally {
      loading.value = false
    }
  }

  async function updateEntry(id, entry) {
    loading.value = true
    error.value = null
    try {
      const response = await fetch(`/api/admin/${contentType}/${encodeURIComponent(id)}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(entry)
      })
      if (!response.ok) {
        const err = await response.json()
        throw new Error(err.error || 'Failed to update')
      }
      const updated = await response.json()
      // Handle ID change
      if (id !== updated.id) {
        delete data.value[id]
      }
      data.value[updated.id] = updated
      return updated
    } catch (e) {
      error.value = e.message
      throw e
    } finally {
      loading.value = false
    }
  }

  async function deleteEntry(id) {
    loading.value = true
    error.value = null
    try {
      const response = await fetch(`/api/admin/${contentType}/${encodeURIComponent(id)}`, {
        method: 'DELETE'
      })
      if (!response.ok) {
        const err = await response.json()
        throw new Error(err.error || 'Failed to delete')
      }
      delete data.value[id]
    } catch (e) {
      error.value = e.message
      throw e
    } finally {
      loading.value = false
    }
  }

  return {
    data,
    loading,
    error,
    fetchAll,
    createEntry,
    updateEntry,
    deleteEntry
  }
}
