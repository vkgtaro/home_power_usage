const retry = require('../src/simple-retry')

let count = 0
const succeedOnTheThirdTimes = jest.fn().mockImplementation(() => {
  return new Promise((resolve, reject) => {
    setTimeout(() => {
      count++
      if (count < 3) {
        reject('rejected')
      }

      resolve('resolved!!')
    }, 10)
  })
})

test('succeed before the limit is exceeded', async () => {
  count = 0
  succeedOnTheThirdTimes.mockClear()
  expect(await retry(succeedOnTheThirdTimes, 3)).toBe('resolved!!')
  expect(succeedOnTheThirdTimes).toHaveBeenCalledTimes(3)
})

test('failed after the limit is exceeded', async () => {
  count = 0
  succeedOnTheThirdTimes.mockClear()

  try {
    await retry(succeedOnTheThirdTimes, 2)
  } catch (err) {
    expect(err).toEqual(new Error('The retry limit has been exceeded.'))
  }

  expect(succeedOnTheThirdTimes).toHaveBeenCalledTimes(2)
})
