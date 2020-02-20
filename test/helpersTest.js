const assert = require('chai').assert;

const { getUserByEmail } = require('../helpers');

const testUsers = {
  'abc': {
    id: 'abc',
    email: 'james@example.com',
    password: 'super-secret-stuff'
  },
  'xyz': {
    id: 'xyz',
    email: 'sarah@example.com',
    password: 'even-better-secret'
  }
};

describe('#getUserByEmail', () => {
  it('should return a user with a valid email', () => {
    const user = getUserByEmail('sarah@example.com', testUsers);
    assert.equal(user, testUsers.xyz);
  });

  it('should return undefined when looking for a non-existent email', () => {
    const user = getUserByEmail('ghostperson@example.com', testUsers);
    assert.equal(user, undefined);
  });
});