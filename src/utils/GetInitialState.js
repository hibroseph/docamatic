import { CURRENT_SCHEMA_VERSION } from "../redux/migrations";

export const GetInitialState = () => { return {
    pages: {},
    tags: [],
    metadata: {
      onboarded: false,
      // A new install starts in the current storage format
      schema_version: CURRENT_SCHEMA_VERSION
    }
  }
}
