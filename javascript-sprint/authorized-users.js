function isAuthorizedUser(authorizedIds) {
    // Return a function to check if an id is authorized
    return function (id) {
      return authorizedIds.includes(id);
    };
  }
  
