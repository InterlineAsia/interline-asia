// Fix for admin dashboard filtering issue
// The problem is likely with the boolean comparison

// Current code probably has:
// const unverifiedUsers = users.filter(user => !user.verified);

// Should be:
// const unverifiedUsers = users.filter(user => user.verified === false);

// This is because user.verified might be null/undefined for some users
// !null and !undefined both return true, which would incorrectly include them

console.log('The issue is in the filtering logic - need to use strict equality check');