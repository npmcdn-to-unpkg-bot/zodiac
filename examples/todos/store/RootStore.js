

export default {
  todos: z.list([
    { checked: z.bool(false), name: z.str("Make Zodiac") }
  ])
};
