
import '@testing-library/jest-dom';

// Explicitly extend Jest's expect with the DOM matchers
import { expect } from '@jest/globals';
import { toBeInTheDocument } from '@testing-library/jest-dom/matchers';

expect.extend({ toBeInTheDocument });
