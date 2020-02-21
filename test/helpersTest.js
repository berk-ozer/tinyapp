const assert = require('chai').assert;

const { getUserByEmail, urlsForUser } = require('../helpers');

// getUserByEmail Test
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

// urlsForUser Test
const testUrls = {
  'abcd': {
    longURL: 'http://www.google.com',
    userID: 'james'
  },
  'xywz': {
    longURL: 'http://www.reddit.com',
    userID: 'sarah'
  },
  'jfkd': {
    longURL: 'http://www.facebook.com',
    userID: 'james'
  }
};

describe('#urlsForUser', () => {
  it('should return the corresponding urls for a valid user', () => {
    const userUrls = urlsForUser('james', testUrls);
    const expectedResult = {
      'abcd': {
        longURL: 'http://www.google.com',
        userID: 'james'
      },
      'jfkd': {
        longURL: 'http://www.facebook.com',
        userID: 'james'
      }
    };

    assert.deepEqual(userUrls, expectedResult);
  });

  it('should return an empty obhect for a non-existent user', () => {
    const userUrls = urlsForUser('crystal', testUrls);
    assert.deepEqual(userUrls, {});
  });
});