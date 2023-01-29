import { generateUUID } from "./GenerateUUID";

export const GetInitialState = () => {
  return {
    pages: {},
    tags: [],
    metadata: {
      onboarded: false,
      user: generateUUID(),
      errors: [],
    },
  };
};
