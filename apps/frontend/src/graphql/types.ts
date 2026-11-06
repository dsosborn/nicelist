export type List = {
  id: string;
  name: string;
  ownerId: string;
  createdAt: string;
};

export type TodoItem = {
  id: string;
  listId: string;
  title: string;
  completed: boolean;
  ownerId: string;
  createdAt: string;
};
