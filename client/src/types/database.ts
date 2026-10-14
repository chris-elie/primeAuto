export type UserRole = 'gestionnaire' | 'employe';
export type AppUser = { nom: string; role: UserRole; email?: string };
export type VehicleStatus = 'ok' | 'entretien' | 'panne';
export type MaintenanceStatus = 'a_venir' | 'en_retard' | 'fait';
export type RevenueType = 'recette' | 'depense';

export type Profile = {
  id: string;
  nom: string;
  role: UserRole;
  created_at: string;
};

export type Vehicle = {
  id: string;
  nom: string;
  kilometrage: number;
  statut: VehicleStatus;
  derniere_revision: string | null;
  created_at: string;
};

export type Maintenance = {
  id: string;
  vehicle_id: string;
  description: string;
  date_prevue: string;
  date_effectuee: string | null;
  cout: number;
  statut: MaintenanceStatus;
  created_at: string;
};

export type Revenue = {
  id: string;
  vehicle_id: string | null;
  montant: number;
  type: RevenueType;
  description: string | null;
  date_transaction: string;
  created_at: string;
};

type TableDefinition<Row, Insert, Update> = {
  Row: Row;
  Insert: Insert;
  Update: Update;
  Relationships: [];
};

export type Database = {
  public: {
    Tables: {
      profiles: TableDefinition<
        Profile,
        { id: string; nom: string; role?: UserRole; created_at?: string },
        { id?: string; nom?: string; role?: UserRole; created_at?: string }
      >;
      vehicles: TableDefinition<
        Vehicle,
        { id?: string; nom: string; kilometrage?: number; statut?: VehicleStatus; derniere_revision?: string | null; created_at?: string },
        { id?: string; nom?: string; kilometrage?: number; statut?: VehicleStatus; derniere_revision?: string | null; created_at?: string }
      >;
      maintenances: TableDefinition<
        Maintenance,
        { id?: string; vehicle_id: string; description: string; date_prevue: string; date_effectuee?: string | null; cout?: number; statut?: MaintenanceStatus; created_at?: string },
        { id?: string; vehicle_id?: string; description?: string; date_prevue?: string; date_effectuee?: string | null; cout?: number; statut?: MaintenanceStatus; created_at?: string }
      >;
      revenues: TableDefinition<
        Revenue,
        { id?: string; vehicle_id?: string | null; montant: number; type: RevenueType; description?: string | null; date_transaction?: string; created_at?: string },
        { id?: string; vehicle_id?: string | null; montant?: number; type?: RevenueType; description?: string | null; date_transaction?: string; created_at?: string }
      >;
    };
    Views: Record<string, never>;
    Functions: {
      current_user_role: { Args: Record<string, never>; Returns: string | null };
    };
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
};
