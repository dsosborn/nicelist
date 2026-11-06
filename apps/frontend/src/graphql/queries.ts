export const listLists = /* GraphQL */ `
  query ListLists {
    listLists {
      id
      name
      ownerId
      createdAt
    }
  }
`;

export const getList = /* GraphQL */ `
  query GetList($id: ID!) {
    getList(id: $id) {
      id
      name
      ownerId
      createdAt
    }
  }
`;

export const listTodoItems = /* GraphQL */ `
  query ListTodoItems($listId: ID!) {
    listTodoItems(listId: $listId) {
      id
      listId
      title
      completed
      ownerId
      createdAt
    }
  }
`;
