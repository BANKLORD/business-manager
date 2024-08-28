export default function auth ({ next, store }){
  if (!store.getters.loggedIn){
    return next({
      name: 'Login'
    })
  }
  return next()
}