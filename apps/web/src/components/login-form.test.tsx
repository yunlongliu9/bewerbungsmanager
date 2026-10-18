// @vitest-environment jsdom

import '@testing-library/jest-dom/vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import React from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { LoginForm } from './login-form';

const push = vi.fn();
const replace = vi.fn();
const login = vi.fn();

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push, replace }),
}));

vi.mock('./auth-provider', () => ({
  useAuth: () => ({ login }),
}));

beforeEach(() => {
  push.mockReset();
  replace.mockReset();
  login.mockReset();
  login.mockResolvedValue(undefined);
});

describe('LoginForm', () => {
  it('submits credentials and navigates to the dashboard', async () => {
    const user = userEvent.setup();
    render(<LoginForm />);

    await user.type(screen.getByLabelText(/email/i), 'owner@example.com');
    await user.type(screen.getByLabelText(/password/i), 'correct-horse-battery-staple');
    await user.click(screen.getByRole('button', { name: /sign in/i }));

    expect(login).toHaveBeenCalledWith('owner@example.com', 'correct-horse-battery-staple');
    expect(replace).toHaveBeenCalledWith('/dashboard');
  });
});
