import { describe, it, expect } from "vitest";
import { render } from "@testing-library/react";
import { Step2OwnerDetails } from "./Step2OwnerDetails";
import { OnboardingProvider } from "@/contexts/OnboardingContext";
import { createEmptyOwner } from "@/types/onboarding.types";

describe("Step2OwnerDetails", () => {
  const renderWithProvider = () => {
    return render(
      <OnboardingProvider>
        <Step2OwnerDetails />
      </OnboardingProvider>
    );
  };

  it("renders the owner details section", () => {
    const { getByText } = renderWithProvider();
    
    expect(getByText("Owners / Partners / Shareholders")).toBeInTheDocument();
    expect(getByText(/Add all partners, shareholders, and beneficial owners/)).toBeInTheDocument();
  });

  it("displays shareholding alert", () => {
    const { getByText } = renderWithProvider();
    
    expect(getByText(/Total Shareholding:/)).toBeInTheDocument();
  });

  it("displays at least one owner card", () => {
    const { getByText } = renderWithProvider();
    
    expect(getByText("Owner / Partner 1")).toBeInTheDocument();
  });

  it("displays Add Owner button", () => {
    const { getByText } = renderWithProvider();
    
    expect(getByText(/Add Owner \/ Partner/)).toBeInTheDocument();
  });

  it("shows validation for shareholding percentages", () => {
    const { container } = renderWithProvider();
    
    // Should show alert component
    const alert = container.querySelector('[role="alert"]');
    expect(alert).toBeInTheDocument();
  });
});
