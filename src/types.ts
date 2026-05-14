export enum TaskStatus {
  PENDIENTE_ASIGNACION = 'pendiente asignación',
  ASIGNADO = 'asignado',
  EN_CURSO = 'en curso',
  TERMINADO = 'terminado'
}

export enum TaskType {
  OPERATIVO = 'Operativo',
  ESTRATEGICO = 'Estratégico',
  ADMINISTRATIVO = 'Administrativo',
  URGENTE = 'Urgente'
}

export interface Task {
  id?: number;
  assignmentDate: string; // Col A
  dueDate: string;        // Col B (Fecha de gestión)
  commitmentDate: string; // Col C (Fecha de compromiso)
  title: string;          // Col D (Tarea)
  assignedTo: string;     // Col E (Responsable)
  observations: string;   // Col F (Observaciones)
  managerComments: string;// Col G (Comentarios de cada gerente)
  status: TaskStatus;     // Col H (Estado)
  taskType?: TaskType;    // Col I (Tipo de Tarea)
}

export interface Manager {
  id: string;
  name: string;
  role: string;
  email: string;
}

export interface User {
  name: string;
  email: string;
  role: string;
}
