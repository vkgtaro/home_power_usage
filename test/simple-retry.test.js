const retry = require('../src/simple-retry')

let count = 0
const succeed_on_the_third_times = jest.fn().mockImplementation(() => {
  return new Promise((resolve, reject) => {
    setTimeout(() => {
      count++
      if (3 > count) {
        reject('rejected')
      }

      resolve('resolved!!')
    }, 10)
  })
})

test('succeed before the limit is exceeded', async () => {
  count = 0
  succeed_on_the_third_times.mockClear()
  expect(await retry(succeed_on_the_third_times, 3)).toBe('resolved!!')
  expect(succeed_on_the_third_times).toHaveBeenCalledTimes(3)
})

test('failed after the limit is exceeded', async () => {
  count = 0
  succeed_on_the_third_times.mockClear()

  try {
    await retry(succeed_on_the_third_times, 2)
  } catch (err) {
    console.log(err)
    expect(err).toEqual(new Error('The retry limit has been exceeded.'))
  }

  expect(succeed_on_the_third_times).toHaveBeenCalledTimes(2)
})
