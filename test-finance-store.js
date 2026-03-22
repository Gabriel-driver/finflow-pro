import React from 'react';
import { render } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { FinanceProvider } from './src/lib/finance-store';

// Test component to check if FinanceProvider renders without errors
const TestComponent = () => {
  const finance = React.useContext(require('./src/lib/finance-store').FinanceContext);
  return <div>Test</div>;
};

const queryClient = new QueryClient();

test('FinanceProvider renders without crashing', () => {
  render(
    <QueryClientProvider client={queryClient}>
      <FinanceProvider>
        <TestComponent />
      </FinanceProvider>
    </QueryClientProvider>
  );
});