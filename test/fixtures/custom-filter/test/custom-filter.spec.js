// Users are able to set a custom specFilter themselves
// karma-jasmine will allow them to do so.

jasmine.getEnv().configure({
  specFilter: function(spec) {
    return spec.name !== 'spec that fails'
  }
})

describe('spec', () => {
  it('that fails', () => {
    fail('This spec should not run!')
  })

  it('that succeeds', () => {
    expect(1).toBe(1)
  })
})
