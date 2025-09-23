import React, { useState } from 'react';
import { Users, Pencil, Trash2, Plus, X } from 'lucide-react';

// Define Supervisor type with nullable coSupervisor
type Supervisor = {
  id: number;
  name: string;
  email: string;
  contact: string;
  faculty: string;
  department: string;
  project: string;
  about: string;
  image: string;
  coSupervisor: {
    name: string;
    email: string;
  } | null;
};

const CoordinatorSupervisorList: React.FC = () => {
  const [supervisors, setSupervisors] = useState<Supervisor[]>([
    {
      id: 1,
      name: 'Dr. N. P. Samarasinghe',
      email: 'nayanathara@uwu.ac.lk',
      contact: '0719873888',
      faculty: 'Faculty of Applied Sciences',
      department: 'Department of Computer Science and Informatics',
      project: 'PMS Dashboard Module',
      about: 'Senior lecturer with research focus in software engineering and student project management.',
      image: 'https://ui-avatars.com/api/?name=N+Samarasinghe&background=34d399&color=fff',
      coSupervisor: {
        name: 'Ms. A. Pathirana',
        email: 'apathirana@uwu.ac.lk',
      },
    },
  ]);

  const [showModal, setShowModal] = useState(false);
  const [newSup, setNewSup] = useState({
    name: '',
    email: '',
    contact: '',
    faculty: '',
    department: '',
    project: '',
    about: '',
    coSupervisorName: '',
    coSupervisorEmail: '',
  });

  const handleAdd = () => {
    if (!newSup.name || !newSup.email) return;

    const id = Date.now();
    const image = `https://ui-avatars.com/api/?name=${newSup.name.replace(/\s+/g, '+')}&background=34d399&color=fff`;

    const newSupervisor: Supervisor = {
      id,
      image,
      name: newSup.name,
      email: newSup.email,
      contact: newSup.contact,
      faculty: newSup.faculty,
      department: newSup.department,
      project: newSup.project,
      about: newSup.about,
      coSupervisor: newSup.coSupervisorName
        ? {
            name: newSup.coSupervisorName,
            email: newSup.coSupervisorEmail,
          }
        : null,
    };

    setSupervisors([...supervisors, newSupervisor]);

    setNewSup({
      name: '',
      email: '',
      contact: '',
      faculty: '',
      department: '',
      project: '',
      about: '',
      coSupervisorName: '',
      coSupervisorEmail: '',
    });
    setShowModal(false);
  };

  const handleDelete = (id: number) => {
    setSupervisors(supervisors.filter((s) => s.id !== id));
  };

  return (
    <div className="flex flex-col gap-6 pb-4 px-4">
      <div className="flex justify-between items-center">
        <div>   
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="bg-black text-white px-4 py-2 rounded flex items-center gap-2 text-sm hover:bg-gray-800"
        >
          <Plus size={16} /> Add Supervisor
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
        {supervisors.map((sup) => (
          <div
            key={sup.id}
            className="bg-green-50 rounded-xl shadow p-4 relative transition-all duration-300 hover:shadow-lg group"
          >
            <div className="flex items-center gap-4">
              <img src={sup.image} alt={sup.name} className="w-12 h-12 rounded-md object-cover border" />
              <div>
                <div className="font-semibold text-sm text-gray-800">{sup.name}</div>
                <div className="text-xs text-gray-600">{sup.email}</div>
              </div>
            </div>

            <div className="hidden group-hover:block mt-3 bg-white rounded-md p-3 text-xs text-gray-700 shadow-inner">
              <div className="font-bold text-sm text-gray-800 mb-1">{sup.name}</div>
              <div><b>Email:</b> {sup.email}</div>
              <div><b>Phone:</b> {sup.contact}</div>
              <div><b>Faculty:</b> {sup.faculty}</div>
              <div><b>Department:</b> {sup.department}</div>
              <div><b>Project:</b> {sup.project}</div>
              <div><b>About:</b> {sup.about}</div>
              {sup.coSupervisor && (
                <div>
                  <b>Co-Supervisor:</b> {sup.coSupervisor.name} ({sup.coSupervisor.email})
                </div>
              )}
            </div>

            <div className="flex gap-2 justify-end mt-3">
              <button className="text-xs border border-black text-black px-2 py-1 rounded flex items-center gap-1 hover:bg-black hover:text-white">
                <Pencil size={14} /> Edit
              </button>
              <button
                onClick={() => handleDelete(sup.id)}
                className="text-xs border border-black text-black px-2 py-1 rounded flex items-center gap-1 hover:bg-black hover:text-white"
              >
                <Trash2 size={14} /> Delete
              </button>
            </div>
          </div>
        ))}
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50">
          <div className="bg-white rounded-lg w-full max-w-xl p-6 relative">
            <button
              className="absolute top-2 right-2 text-gray-500 hover:text-black"
              onClick={() => setShowModal(false)}
            >
              <X size={18} />
            </button>
            <h2 className="text-lg font-bold mb-4 text-black">Add Supervisor</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <input
                className="border p-2 rounded"
                placeholder="Full Name"
                value={newSup.name}
                onChange={(e) => setNewSup({ ...newSup, name: e.target.value })}
              />
              <input
                className="border p-2 rounded"
                placeholder="Email"
                value={newSup.email}
                onChange={(e) => setNewSup({ ...newSup, email: e.target.value })}
              />
              <input
                className="border p-2 rounded"
                placeholder="Contact"
                value={newSup.contact}
                onChange={(e) => setNewSup({ ...newSup, contact: e.target.value })}
              />
              <input
                className="border p-2 rounded"
                placeholder="Faculty"
                value={newSup.faculty}
                onChange={(e) => setNewSup({ ...newSup, faculty: e.target.value })}
              />
              <input
                className="border p-2 rounded"
                placeholder="Department"
                value={newSup.department}
                onChange={(e) => setNewSup({ ...newSup, department: e.target.value })}
              />
              <input
                className="border p-2 rounded"
                placeholder="Project"
                value={newSup.project}
                onChange={(e) => setNewSup({ ...newSup, project: e.target.value })}
              />
              <textarea
                className="border p-2 rounded col-span-full"
                placeholder="About"
                value={newSup.about}
                onChange={(e) => setNewSup({ ...newSup, about: e.target.value })}
              ></textarea>
              <input
                className="border p-2 rounded"
                placeholder="Co-Supervisor Name"
                value={newSup.coSupervisorName}
                onChange={(e) => setNewSup({ ...newSup, coSupervisorName: e.target.value })}
              />
              <input
                className="border p-2 rounded"
                placeholder="Co-Supervisor Email"
                value={newSup.coSupervisorEmail}
                onChange={(e) => setNewSup({ ...newSup, coSupervisorEmail: e.target.value })}
              />
            </div>
            <div className="flex justify-end gap-2 mt-4">
              <button
                onClick={handleAdd}
                className="bg-black hover:bg-gray-900 text-white px-4 py-2 rounded text-sm"
              >
                Save
              </button>
              <button
                onClick={() => setShowModal(false)}
                className="border border-black text-black px-4 py-2 rounded text-sm hover:bg-black hover:text-white"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CoordinatorSupervisorList;