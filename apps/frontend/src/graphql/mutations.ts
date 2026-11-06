export const createList = /* GraphQL */ `
  mutation CreateList($name: String!) {
    createList(name: $name) {
      id
      name
      ownerId
      createdAt
    }
  }
`;

export const createTodoItem = /* GraphQL */ `
  mutation CreateTodoItem($listId: ID!, $title: String!) {
    createTodoItem(listId: $listId, title: $title) {
      id
      listId
      title
      completed
      ownerId
      createdAt
    }
  }
`;

export const updateTodoItem = /* GraphQL */ `
  mutation UpdateTodoItem($listId: ID!, $id: ID!, $title: String, $completed: Boolean) {
    updateTodoItem(listId: $listId, id: $id, title: $title, completed: $completed) {
      id
      listId
      title
      completed
      ownerId
      createdAt
    }
  }
`;

export const deleteTodoItem = /* GraphQL */ `
  mutation DeleteTodoItem($listId: ID!, $id: ID!) {
    deleteTodoItem(listId: $listId, id: $id) {
      id
      listId
      title
      completed
      ownerId
      createdAt
    }
  }
`;

export const deleteList = /* GraphQL */ `
  mutation DeleteList($id: ID!) {
    deleteList(id: $id) {
      id
      name
      ownerId
      createdAt
    }
  }
`;
