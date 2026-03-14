import { describe, it, expect, vi, beforeEach } from "vitest";
import { render } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { Step2OwnerDetails } from "./Step2OwnerDetails";
import { OnboardingProvider } from "@/contexts/OnboardingContext";
import { createEmptyFormData, createEmptyOwner } from "@/types/onboarding.types";

describe("Step2OwnerDetails", () => {
  const mockContextValue = {
    formData: createEmptyFormData(),
    currentStep: 2,
    setCurrentStep: vi.fn(),
    updateBusinessDetails: vi.fn(),
    updateOwner: vi.fn(),
    addOwner: vi.fn(),
    removeOwner: vi.fn(),
    updateBankingTurnover: vi.fn(),
    updateLoanRequirement: vi.fn(),
    addDocument: vi.fn(),
    removeDocument: vi.fn(),
    updateDeclarations: vi.fn(),
    isStepValid: vi.fn(() => true),
    resetForm: vi.fn(),
    getTotalShareholding: vi.fn(() => 100),
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  const renderWithContext = (contextValue = mockContextValue) => {
    return render(
      <OnboardingContext.Provider value={contextValue}>
        <Step2OwnerDetails />
      </OnboardingContext.Provider>
    );
  };

  it("renders the owner details section", () => {
    renderWithContext();
    
    expect(screen.getByText("Owners / Partners / Shareholders")).toBeInTheDocument();
    expect(screen.getByText(/Add all partners, shareholders, and beneficial owners/)).toBeInTheDocument();
  });

  it("displays shareholding total as 100% with success styling", () => {
    renderWithContext();
    
    expect(screen.getByText(/Total Shareholding: 100%/)).toBeInTheDocument();
    expect(screen.getByText("1 owner")).toBeInTheDocument();
  });

  it("displays warning when shareholding is under 100%", () => {
    const contextWithPartialShares = {
      ...mockContextValue,
      formData: {
        ...mockContextValue.formData,
        owners: [{
          ...createEmptyOwner(),
          shareholdingPercent: 60,
        }],
      },
      getTotalShareholding: vi.fn(() => 60),
    };

    renderWithContext(contextWithPartialShares);
    
    expect(screen.getByText(/Total Shareholding: 60%/)).toBeInTheDocument();
    expect(screen.getByText("(40% remaining)")).toBeInTheDocument();
  });

  it("displays error when shareholding exceeds 100%", () => {
    const contextWithExcessShares = {
      ...mockContextValue,
      formData: {
        ...mockContextValue.formData,
        owners: [{
          ...createEmptyOwner(),
          shareholdingPercent: 120,
        }],
      },
      getTotalShareholding: vi.fn(() => 120),
    };

    renderWithContext(contextWithExcessShares);
    
    expect(screen.getByText(/Total Shareholding: 120%/)).toBeInTheDocument();
    expect(screen.getByText("(Exceeds 100%)")).toBeInTheDocument();
  });

  it("displays multiple owners correctly", () => {
    const owner1 = { ...createEmptyOwner(), id: "1", ownerName: "John Smith", shareholdingPercent: 60 };
    const owner2 = { ...createEmptyOwner(), id: "2", ownerName: "Jane Doe", shareholdingPercent: 40 };
    
    const contextWithMultipleOwners = {
      ...mockContextValue,
      formData: {
        ...mockContextValue.formData,
        owners: [owner1, owner2],
      },
      getTotalShareholding: vi.fn(() => 100),
    };

    renderWithContext(contextWithMultipleOwners);
    
    expect(screen.getByText("Owner / Partner 1")).toBeInTheDocument();
    expect(screen.getByText("Owner / Partner 2")).toBeInTheDocument();
    expect(screen.getByText("2 owners")).toBeInTheDocument();
  });

  it("calls addOwner when Add Owner button is clicked", () => {
    renderWithContext();
    
    const addButton = screen.getByRole("button", { name: /Add Owner \/ Partner/i });
    fireEvent.click(addButton);
    
    expect(mockContextValue.addOwner).toHaveBeenCalled();
  });

  it("detects duplicate Emirates IDs", () => {
    const owner1 = { ...createEmptyOwner(), id: "1", emiratesId: "784-1234-1234567-1" };
    const owner2 = { ...createEmptyOwner(), id: "2", emiratesId: "784-1234-1234567-1" };
    
    const contextWithDuplicates = {
      ...mockContextValue,
      formData: {
        ...mockContextValue.formData,
        owners: [owner1, owner2],
      },
    };

    renderWithContext(contextWithDuplicates);
    
    const warnings = screen.getAllByText("Duplicate Emirates ID detected");
    expect(warnings).toHaveLength(2);
  });

  it("detects duplicate Passport Numbers", () => {
    const owner1 = { ...createEmptyOwner(), id: "1", passportNumber: "GB123456" };
    const owner2 = { ...createEmptyOwner(), id: "2", passportNumber: "GB123456" };
    
    const contextWithDuplicates = {
      ...mockContextValue,
      formData: {
        ...mockContextValue.formData,
        owners: [owner1, owner2],
      },
    };

    renderWithContext(contextWithDuplicates);
    
    const warnings = screen.getAllByText("Duplicate Passport Number detected");
    expect(warnings).toHaveLength(2);
  });

  it("does not show duplicate warning for empty IDs", () => {
    const owner1 = { ...createEmptyOwner(), id: "1", emiratesId: "" };
    const owner2 = { ...createEmptyOwner(), id: "2", emiratesId: "" };
    
    const contextWithEmptyIds = {
      ...mockContextValue,
      formData: {
        ...mockContextValue.formData,
        owners: [owner1, owner2],
      },
    };

    renderWithContext(contextWithEmptyIds);
    
    const warnings = screen.queryAllByText("Duplicate Emirates ID detected");
    expect(warnings).toHaveLength(0);
  });

  it("displays owner count in plural form", () => {
    const owner1 = { ...createEmptyOwner(), id: "1" };
    const owner2 = { ...createEmptyOwner(), id: "2" };
    const owner3 = { ...createEmptyOwner(), id: "3" };
    
    const contextWithThreeOwners = {
      ...mockContextValue,
      formData: {
        ...mockContextValue.formData,
        owners: [owner1, owner2, owner3],
      },
      getTotalShareholding: vi.fn(() => 100),
    };

    renderWithContext(contextWithThreeOwners);
    
    expect(screen.getByText("3 owners")).toBeInTheDocument();
  });
});
