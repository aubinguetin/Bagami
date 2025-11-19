importScripts('https://www.gstatic.com/firebasejs/9.6.11/firebase-app-compat.js')
importScripts('https://www.gstatic.com/firebasejs/9.6.11/firebase-messaging-compat.js')

let messaging = null

self.addEventListener('message', (event) => {
  const data = event.data || {}
  if (data.type === 'SET_FIREBASE_CONFIG' && data.config) {
    try {
      firebase.initializeApp(data.config)
      messaging = firebase.messaging()
      messaging.onBackgroundMessage((payload) => {
        const title = payload.notification?.title || payload.data?.title || 'Bagami'
        const body = payload.notification?.body || payload.data?.body || ''
        const nd = payload.data || {}
        const options = { body, data: nd }
        self.registration.showNotification(title, options)
      })
    } catch (e) {
      // noop
    }
  }
})

self.addEventListener('notificationclick', event => {
  event.notification.close()
  const data = event.notification.data || {}
  const url = data.link || '/'
  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then(win => {
      const client = win.find(c => c.url.includes('/') && 'focus' in c)
      if (client) return client.focus()
      return clients.openWindow(url)
    })
  )
})
