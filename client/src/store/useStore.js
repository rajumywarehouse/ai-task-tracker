import { create } from 'zustand';

const useStore = create((set) => ({
    user: JSON.parse(localStorage.getItem('user')) || null,
    token: localStorage.getItem('token') || null,
    
    setAuth: (user, token) => {
        localStorage.setItem('user', JSON.stringify(user));
        localStorage.setItem('token', token);
        set({ user, token });
    },
    
    logout: () => {
        localStorage.removeItem('user');
        localStorage.removeItem('token');
        set({ user: null, token: null });
    },
    
    tasks: [],
    setTasks: (tasks) => set({ tasks }),
    
    users: [],
    setUsers: (users) => set({ users }),
    
    selectedTasks: [],
    setSelectedTasks: (selectedTasks) => set({ selectedTasks }),
    
    filters: {
        status: '',
        priority: '',
        responsible_person_id: '',
        overdue: false,
        sla_breach: false
    },
    setFilters: (filters) => set({ filters }),
}));

export default useStore;
