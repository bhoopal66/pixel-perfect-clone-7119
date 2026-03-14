import { describe, it, expect, vi } from "vitest";
import { render } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { OwnerCard } from "./OwnerCard";
import { createEmptyOwner } from "@/types/onboarding.types";

describe("OwnerCard", () => {
  const mockOwner = {
    ...createEmptyOwner(),
    ownerName: "John Smith",
    role: "Managing Partner",
    shareholdingPercent: 60,
    nationality: "UK",
    emiratesId: "784-1234-1234567-1",
    passportNumber: "GB123456",
    mobile: "+971501234567",
    email: "john@example.com",
    address: "123 Business Bay, Dubai",
    isSignatory: true,
    isUbo: true,
  };

  const mockProps = {
    owner: mockOwner,
    index: 0,
    totalOwners: 2,
    onUpdate: vi.fn(),
    onRemove: vi.fn(),
    onMoveUp: vi.fn(),
    onMoveDown: vi.fn(),
    canRemove: true,
    duplicateWarnings: [],
  };

  it("renders owner details correctly", () => {
    const { getByDisplayValue } = render(<OwnerCard {...mockProps} />);
    
    expect(getByDisplayValue("John Smith")).toBeInTheDocument();
    expect(getByDisplayValue("60")).toBeInTheDocument();
    expect(getByDisplayValue("+971501234567")).toBeInTheDocument();
    expect(getByDisplayValue("john@example.com")).toBeInTheDocument();
  });

  it("displays role and status badges", () => {
    const { getByText } = render(<OwnerCard {...mockProps} />);
    
    expect(getByText("Managing Partner")).toBeInTheDocument();
    expect(getByText("Signatory")).toBeInTheDocument();
    expect(getByText("UBO")).toBeInTheDocument();
  });

  it("calls onUpdate when name is changed", async () => {
    const user = userEvent.setup();
    const { getByDisplayValue } = render(<OwnerCard {...mockProps} />);
    
    const nameInput = getByDisplayValue("John Smith");
    await user.clear(nameInput);
    await user.type(nameInput, "John Doe");
    
    expect(mockProps.onUpdate).toHaveBeenCalled();
  });

  it("calls onUpdate when ownership percentage is changed", async () => {
    const user = userEvent.setup();
    const { getByDisplayValue } = render(<OwnerCard {...mockProps} />);
    
    const percentInput = getByDisplayValue("60");
    await user.clear(percentInput);
    await user.type(percentInput, "70");
    
    expect(mockProps.onUpdate).toHaveBeenCalled();
  });

  it("calls onRemove when delete button is clicked", async () => {
    const user = userEvent.setup();
    const { container } = render(<OwnerCard {...mockProps} />);
    
    const deleteButton = container.querySelector('button svg.lucide-trash-2')?.closest('button');
    if (deleteButton) {
      await user.click(deleteButton);
    }
    
    expect(mockProps.onRemove).toHaveBeenCalled();
  });

  it("does not show delete button when canRemove is false", () => {
    render(<OwnerCard {...mockProps} canRemove={false} />);
    
    const deleteButtons = screen.queryAllByRole("button", { name: /trash/i });
    expect(deleteButtons).toHaveLength(0);
  });

  it("displays duplicate warnings", () => {
    const warnings = ["Duplicate Emirates ID detected", "Duplicate Passport Number detected"];
    render(<OwnerCard {...mockProps} duplicateWarnings={warnings} />);
    
    expect(screen.getByText("Duplicate Emirates ID detected")).toBeInTheDocument();
    expect(screen.getByText("Duplicate Passport Number detected")).toBeInTheDocument();
  });

  it("disables move up button for first owner", () => {
    render(<OwnerCard {...mockProps} index={0} />);
    
    const moveUpButtons = screen.getAllByRole("button");
    const upButton = moveUpButtons.find(btn => btn.querySelector('.lucide-chevron-up'));
    expect(upButton).toBeDisabled();
  });

  it("disables move down button for last owner", () => {
    render(<OwnerCard {...mockProps} index={1} totalOwners={2} />);
    
    const moveDownButtons = screen.getAllByRole("button");
    const downButton = moveDownButtons.find(btn => btn.querySelector('.lucide-chevron-down'));
    expect(downButton).toBeDisabled();
  });

  it("toggles signatory status", () => {
    render(<OwnerCard {...mockProps} />);
    
    const signatorySwitch = screen.getByRole("switch", { name: /authorized signatory/i });
    fireEvent.click(signatorySwitch);
    
    expect(mockProps.onUpdate).toHaveBeenCalledWith({ isSignatory: false });
  });

  it("toggles UBO status", () => {
    render(<OwnerCard {...mockProps} />);
    
    const uboSwitch = screen.getByRole("switch", { name: /ultimate beneficial owner/i });
    fireEvent.click(uboSwitch);
    
    expect(mockProps.onUpdate).toHaveBeenCalledWith({ isUbo: false });
  });
});
