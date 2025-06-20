import React from 'react';
import { render, screen } from '@testing-library/react';
import App from './App';

describe('Applied Sciences UI App', () => {
  test('renders without crashing', () => {
    render(<App />);
  });

  test('displays the main heading', () => {
    render(<App />);
    // Update this selector based on your actual App component
    const headingElement = screen.getByText(/applied sciences/i);
    expect(headingElement).toBeInTheDocument();
  });

  test('has proper document title', () => {
    render(<App />);
    expect(document.title).toContain('Applied Sciences');
  });
}); 