export type Priority = "Low" | "Medium" | "High";
export type Status = "Open" | "In Progress" | "On Hold" | "Done";
export type Criticality = "Low" | "Medium" | "High" | "Critical";

export interface User {
    id: string;
    name: string;
    email: string;
    avatar?: string;
}

export interface Location {
    id: string;
    name: string;
    address?: string;
    description?: string;
    staffCount?: number;
    teamsInCharge?: string[];
    image?: string;
}

export interface Asset {
    id: string;
    name: string;
    locationId: string;
    criticality: Criticality;
    description?: string;
    notes?: string;
    purchaseDate?: string;
    purchasePrice?: number;
    annualDepreciation?: number;
    warrantyEndDate?: string;
    vinNumber?: string;
    replacementCost?: number;
    serialNumber?: string;
    model?: string;
    manufacturer?: string;
    teamsInCharge?: string[];
    qrCode?: string;
    files?: string[];
    assetType?: string;
    vendors?: string[];
    status: "Online" | "Offline";
    image?: string;
    subAssetsCount?: number;
    year?: number;
    parentAssetId?: string;
}

export interface WorkOrder {
    id: string;
    title: string;
    description?: string;
    procedure?: string;
    locationId: string;
    assetId?: string;
    criticality?: Criticality;
    assignedTo: string[]; // User IDs
    dueDate: string;
    priority: Priority;
    status: Status;
    files?: string[];
    parts?: string[];
    categories?: string[];
    vendors?: string[];
    createdAt: string;
}

export const users: User[] = [
    { id: "u1", name: "Zach Brown", email: "zach@example.com", avatar: "https://github.com/shadcn.png" },
    { id: "u2", name: "Alice Smith", email: "alice@example.com" },
    { id: "u3", name: "Bob Jones", email: "bob@example.com" },
];

export const locations: Location[] = [
    { id: "l1", name: "General", description: "Main facility area" },
    { id: "l2", name: "Maintenance Shop", description: "Workshop for repairs" },
    { id: "l3", name: "Production Line 1", description: "Main assembly line" },
];

export const assets: Asset[] = [
    {
        id: "a1",
        name: "Forklift #9",
        locationId: "l1",
        criticality: "Medium",
        status: "Online",
        model: "GP15-35(C)N",
        manufacturer: "Cat",
        serialNumber: "356354363DFGDF",
        image: "/placeholder-forklift.png",
        subAssetsCount: 4,
        year: 2023,
    },
    {
        id: "a2",
        name: "Air Compressor",
        locationId: "l2",
        criticality: "High",
        status: "Online",
        model: "VSS Single Screw",
        manufacturer: "VSS",
        image: "/placeholder-compressor.png",
        subAssetsCount: 4,
        year: 2024,
    },
    {
        id: "a3",
        name: "Durr Robot",
        locationId: "l3",
        criticality: "High",
        status: "Offline",
        model: "E043i",
        manufacturer: "Durr",
        image: "/placeholder-robot.png",
        subAssetsCount: 4,
        year: 2022,
    },
    {
        id: "a4",
        name: "Second Main HVAC System",
        locationId: "l1",
        criticality: "Medium",
        status: "Online",
        subAssetsCount: 4,
        year: 2025,
    },
];

export const workOrders: WorkOrder[] = [
    {
        id: "#2097",
        title: "[Safety] Compressor - LOTO",
        description: "Perform Lockout/Tagout procedure on the main air compressor.",
        locationId: "l2",
        assetId: "a2",
        priority: "Medium",
        status: "Open",
        assignedTo: ["u1"],
        dueDate: "2025-12-20T13:00:00",
        createdAt: "2025-12-18T09:00:00",
    },
    {
        id: "#2098",
        title: "Wrapper Malfunction - Items Stuck",
        description: "Items are getting stuck on the belt.",
        locationId: "l3",
        priority: "High",
        status: "Open",
        assignedTo: ["u2"],
        dueDate: "2025-12-19T15:00:00",
        createdAt: "2025-12-19T08:30:00",
    },
    {
        id: "#2089",
        title: "Daily Site Walk Inspection",
        locationId: "l1",
        priority: "Low",
        status: "In Progress",
        assignedTo: ["u1", "u3"],
        dueDate: "2025-12-19T17:00:00",
        createdAt: "2025-12-19T08:00:00",
    },
];

export interface Procedure {
    id: string;
    title: string;
    description?: string;
    fields: ProcedureField[];
    createdAt: string;
    updatedAt: string;
}

export interface ProcedureField {
    id: string;
    type: "text" | "checkbox" | "number" | "multiple_choice" | "photo" | "signature" | "instruction";
    label: string;
    required: boolean;
    options?: string[]; // For multiple choice
}

export const procedures: Procedure[] = [
    {
        id: "p1",
        title: "Compressor Quarterly Maintenance",
        description: "Standard quarterly maintenance for air compressors.",
        createdAt: "2025-11-01T10:00:00",
        updatedAt: "2025-12-01T14:30:00",
        fields: [
            { id: "f1", type: "instruction", label: "Safety Reminder - are you wearing safety goggles?", required: false },
            { id: "f2", type: "checkbox", label: "Check oil level", required: true },
            { id: "f3", type: "text", label: "Record pressure reading (PSI)", required: true },
        ]
    },
    {
        id: "p2",
        title: "Forklift Daily Inspection",
        description: "Daily safety check for forklifts.",
        createdAt: "2025-11-15T08:00:00",
        updatedAt: "2025-11-15T08:00:00",
        fields: [
            { id: "f1", type: "checkbox", label: "Check tires", required: true },
            { id: "f2", type: "checkbox", label: "Check horn", required: true },
            { id: "f3", type: "checkbox", label: "Check brakes", required: true },
        ]
    },
    {
        id: "p3",
        title: "LOTO Protocol",
        description: "Lockout/Tagout standard procedure.",
        createdAt: "2025-10-20T09:00:00",
        updatedAt: "2025-10-20T09:00:00",
        fields: [
            { id: "f1", type: "text", label: "Lock ID", required: true },
            { id: "f2", type: "signature", label: "Technician Signature", required: true },
        ]
    }
];
export interface Request {
    id: string;
    title: string;
    description: string;
    requester: string;
    status: "Pending" | "Approved" | "Declined";
    createdAt: string;
}

export const requests: Request[] = [
    {
        id: "r1",
        title: "HVAC Maintenance",
        description: "The AC in the server room is making a loud noise.",
        requester: "John Doe",
        status: "Pending",
        createdAt: "2025-12-19T10:00:00",
    },
    {
        id: "r2",
        title: "Lighting Repair",
        description: "Several lights in the warehouse are flickering.",
        requester: "Jane Smith",
        status: "Approved",
        createdAt: "2025-12-18T14:30:00",
    },
    {
        id: "r3",
        title: "Plumbing Issue",
        description: "Leaking faucet in the break room.",
        requester: "Mike Johnson",
        status: "Declined",
        createdAt: "2025-12-17T09:15:00",
    },
    {
        id: "r4",
        title: "New Monitor Request",
        description: "Need a second monitor for the new workstation.",
        requester: "Sarah Connor",
        status: "Pending",
        createdAt: "2025-12-19T11:45:00",
    },
];
