# Implementation Plan: Advanced Asset Selection for Work Order Form

## Objective
Implement a "MaintainX"-like asset selection experience where users can select multiple assets, triggering a "Sub Work Order" creation flow. The UI shifts from a simple dropdown to a detailed table view when multiple assets are selected, allowing individual procedure assignment.

## Components Structure

### 1. `AssetSelectionControl` (New Component)
Located at: `components/forms/work-order/asset-selection-control.tsx`
This component will handle the complexity of:
- Switching between Single Select (Combobox) and Multi-Select (Table) views.
- Managing the "Add Multiple Assets" dialog.
- Managing the "Add Procedure" dialog.
- Displaying the Selected Assets table with status and procedure assignment.

**Props:**
- `assets`: Array of available assets.
- `procedures`: Array of available procedures.
- `selectedAssetIds`: Array of currently selected asset IDs (controlled by parent form).
- `onAssetsChange`: Callback to update selected assets.
- `assignedProcedures`: Map of `assetId -> procedureId` (controlled by parent form).
- `onProcedureChange`: Callback to update procedure assignments.

### 2. `WorkOrderForm` (Update)
- **State**:
  - Add `procedures` state (fetched from `/api/procedures`).
  - Add `assignedProcedures` state (to track procedure per asset).
- **Logic**:
  - Initial fetch should now include `procedures`.
  - Replace the existing `Asset` field (TreeSelect) with the new `AssetSelectionControl`.
  - Handle submission: Transform the `assignedProcedures` map into the payload (likely creating sub-work orders or adding metadata).

## Detailed UI/UX Flow

1.  **Initial State / Single Selection**:
    - Display a **Combobox** (Searchable Dropdown) for selecting a single asset.
    - Below the input, display a **"+ Add multiple assets"** button.
    - If a single asset is selected:
      - Display the asset status (e.g., "Operational" in Green) as a read-only badge/label next to the name.

2.  **Multiple Asset Selection**:
    - Clicking "+ Add multiple assets" opens a **Dialog**.
    - **Dialog Content**: A searchable list of assets with checkboxes.
    - **Action**: "Add Assets" button confirms selection.

3.  **Selected Assets View (Table)**:
    - When >1 assets are selected, the input is replaced (or hidden) by a **Table**.
    - **Table Columns**:
      - **Asset Name**: Icon + Name.
      - **Status**: Live status badge (e.g., Online/Offline).
      - **Procedure**: 
        - If no procedure assigned: "**Add procedure**" (Blue clickable text).
        - If assigned: Procedure Name (clickable to change).
    - **Header**: "Selected Assets (Count)" with a "+ Add Assets" button to re-open the dialog.

4.  **Procedure Assignment**:
    - Clicking on "Add procedure" (or the procedure name) opens a **Procedure Dialog**.
    - **Procedure Dialog Content**:
      - Searchable list of Procedure Templates.
      - **Check option**: "Use the same procedure for all assets" (checkbox at bottom).
    - **Action**: "Add Procedure" assigns the selected procedure to the specific asset (or all if checked).

## Technical Implementation Steps

1.  **Fetch Data**: Modify `WorkOrderForm` to fetch procedures.
2.  **Create Component**: Build `AssetSelectionControl` with ShadCN UI components (`Dialog`, `Table`, `Command`/`Combobox`, `Checkbox`, `Badge`).
3.  **Integrate**: Replace the old Asset field in `WorkOrderForm` with `AssetSelectionControl`.
4.  **Refine**: Ensure styles match the screenshots (borders, spacing, colors).

## Future Considerations (Backend)
- The form submission handler will need to inspect the `assignedProcedures` map.
- If multiple assets are present, the backend logic (or frontend submit handler) needs to split this into multiple work orders or a parent-child structure as per the user's business logic.
