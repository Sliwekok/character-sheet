import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { Button } from "./Button";

describe("Button", () => {
  it("renders a non-submitting button by default and calls onClick", async () => {
    const onClick = vi.fn();
    const user = userEvent.setup();
    render(<Button onClick={onClick}>Save</Button>);
    const button = screen.getByRole("button", { name: "Save" });
    expect(button).toHaveAttribute("type", "button");
    await user.click(button);
    expect(onClick).toHaveBeenCalledTimes(1);
  });

  it("does not submit an enclosing form unless type='submit' is passed", async () => {
    const onSubmit = vi.fn((event: React.FormEvent) => event.preventDefault());
    const user = userEvent.setup();
    const { rerender } = render(
      <form onSubmit={onSubmit}>
        <Button>Plain</Button>
      </form>
    );
    await user.click(screen.getByRole("button", { name: "Plain" }));
    expect(onSubmit).not.toHaveBeenCalled();

    rerender(
      <form onSubmit={onSubmit}>
        <Button type="submit">Go</Button>
      </form>
    );
    await user.click(screen.getByRole("button", { name: "Go" }));
    expect(onSubmit).toHaveBeenCalledTimes(1);
  });

  it("a disabled button ignores clicks", async () => {
    const onClick = vi.fn();
    const user = userEvent.setup();
    render(
      <Button disabled onClick={onClick}>
        Nope
      </Button>
    );
    expect(screen.getByRole("button", { name: "Nope" })).toBeDisabled();
    await user.click(screen.getByRole("button", { name: "Nope" }));
    expect(onClick).not.toHaveBeenCalled();
  });

  it("forwards other button attributes", () => {
    render(<Button aria-label="Close dialog" title="Close">✕</Button>);
    expect(screen.getByRole("button", { name: "Close dialog" })).toHaveAttribute("title", "Close");
  });

  it("renders a link instead of a button when given an href", () => {
    render(
      <Button href="/characters" target="_blank">
        My characters
      </Button>
    );
    const link = screen.getByRole("link", { name: "My characters" });
    expect(link).toHaveAttribute("href", "/characters");
    expect(link).toHaveAttribute("target", "_blank");
    expect(screen.queryByRole("button")).not.toBeInTheDocument();
  });
});
