const retry = async (callback, max_limit = 7, count = 0) => {
  try {
    return await callback()
  } catch (err) {
    count++
    if (max_limit > count) {
      return retry(callback, max_limit, count)
    } else {
      throw new Error('The retry limit has been exceeded.')
    }
  }
}

module.exports = retry
