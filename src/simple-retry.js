const retry = async (callback, maxLimit = 7, count = 0) => {
  try {
    return await callback()
  } catch (err) {
    count++
    if (maxLimit > count) {
      return retry(callback, maxLimit, count)
    } else {
      throw new Error('The retry limit has been exceeded.')
    }
  }
}

module.exports = retry
