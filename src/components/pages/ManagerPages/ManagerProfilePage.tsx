// src/pages/manager/ManagerProfilePage.tsx
import React, { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import {
  Box,
  Button as CButton,
  Heading,
  Input,
  Textarea,
  Text,
} from '@chakra-ui/react';
import {
  Lock,
  Mail,
  User as UserIcon,
  Upload,
  Camera,
  GraduationCap,
  Info,
} from 'lucide-react';
import { getAuth } from '../../../lib/api';

type FormData = {
  name: string;
  email: string;
  password: string;
  academicYear: string;
  bio: string;
  profileImage: FileList;
};

const academicYears = ['1st Year', '2nd Year', '3rd Year', '4th Year'];

const ManagerProfilePage: React.FC = () => {
  const { register, handleSubmit, watch, getValues, reset } = useForm<FormData>({
    defaultValues: {
      name: '',
      email: '',
      password: '',
      academicYear: '',
      bio: '',
    },
  });

  const [imagePreview, setImagePreview] = useState<string>('https://i.pravatar.cc/300?u=preview');
  const [loading, setLoading] = useState<boolean>(true);
  const [saving, setSaving] = useState<boolean>(false);
  const [err, setErr] = useState<string>('');
  const profileImage = watch('profileImage');

  // Local preview of selected image
  useEffect(() => {
    if (profileImage && profileImage.length > 0) {
      const file = profileImage[0];
      const reader = new FileReader();
      reader.onloadend = () => setImagePreview(reader.result as string);
      reader.readAsDataURL(file);
    }
  }, [profileImage]);

  // Load current profile
  useEffect(() => {
    let alive = true;
    (async () => {
      setLoading(true);
      setErr('');
      try {
        const auth = getAuth();
        const res = await fetch(
          `${import.meta.env.VITE_BASE_URL}/api/profile.php?action=view`,
          {
            method: 'GET',
            headers: {
              'Content-Type': 'application/json',
              ...(auth?.token ? { Authorization: `Bearer ${auth.token}` } : {}),
            },
            credentials: 'include',
          }
        );
        const text = await res.text();
        let data: any;
        try {
          data = JSON.parse(text);
        } catch {
          throw new Error('API did not return JSON');
        }
        if (!res.ok || !data?.success) throw new Error(data?.message || `Load failed (HTTP ${res.status})`);

        const p = data.profile || {};
        if (!alive) return;

        reset({
          name: p.name || '',
          email: p.email || '',
          password: '',
          academicYear: p.academic_year || '',
          bio: p.bio || '',
        });

        if (p.profile_image) {
          setImagePreview(p.profile_image);
        } else if (p.email) {
          setImagePreview(`https://i.pravatar.cc/300?u=${encodeURIComponent(p.email)}`);
        }
      } catch (e: any) {
        if (alive) setErr(e?.message || 'Failed to load profile');
      } finally {
        if (alive) setLoading(false);
      }
    })();
    return () => {
      alive = false;
    };
  }, [reset]);

  // Submit update
  const onSubmit = async (data: FormData) => {
    try {
      setSaving(true);
      setErr('');
      const auth = getAuth();

      // ---- 1) Update text fields ----
      const res = await fetch(
        `${import.meta.env.VITE_BASE_URL}/api/profile.php?action=update`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            ...(auth?.token ? { Authorization: `Bearer ${auth.token}` } : {}),
          },
          credentials: 'include',
          body: JSON.stringify({
            name: data.name || null,
            email: data.email || null,
            password: data.password || null,
            academic_year: data.academicYear || null,
            bio: data.bio || null,
          }),
        }
      );
      const text = await res.text();
      let result: any;
      try {
        result = JSON.parse(text);
      } catch {
        throw new Error('API did not return JSON');
      }
      if (!res.ok || !result?.success) {
        throw new Error(result?.message || `Update failed (HTTP ${res.status})`);
      }

      // ---- 2) Upload image if selected ----
      if (data.profileImage && data.profileImage.length > 0) {
        const formData = new FormData();
        formData.append('profile_image', data.profileImage[0]); // must match backend key

        const imgRes = await fetch(
          `${import.meta.env.VITE_BASE_URL}/api/profile.php?action=upload-image`,
          {
            method: 'POST',
            headers: {
              ...(auth?.token ? { Authorization: `Bearer ${auth.token}` } : {}),
            },
            credentials: 'include',
            body: formData,
          }
        );

        const imgText = await imgRes.text();
        let imgResult: any;
        try {
          imgResult = JSON.parse(imgText);
        } catch {
          throw new Error('Image API did not return JSON');
        }
        if (!imgRes.ok || !imgResult?.success) {
          throw new Error(imgResult?.message || 'Failed to upload image');
        }

        if (imgResult.profile_image_url) {
          setImagePreview(imgResult.profile_image_url);
        }
      }

      // ✅ Reset form with latest profile data
      const p = result.profile || {};
      reset({
        name: p.name || '',
        email: p.email || '',
        password: '',
        academicYear: p.academic_year || '',
        bio: p.bio || '',
      });

      alert('Profile updated successfully.');
    } catch (e: any) {
      setErr(e?.message || 'Server error while updating profile.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="flex flex-col gap-6 pb-4">
      <div className="flex flex-col">
        <div className="font-bold text-3xl flex gap-2 items-center">
          <UserIcon size={30} />
          My Profile
        </div>
        <div className="text-xs text-gray-600 ml-8 mt-1">
          Keep your profile up-to-date and personalize your workspace
        </div>
      </div>

      {err && (
        <div className="text-sm text-red-600 border border-red-300 rounded p-2">
          {err}
        </div>
      )}

      <div className="flex border rounded-md overflow-hidden">
        <div className="w-1/3 p-6 bg-white border-r">
          <Heading size="md" fontFamily="Roboto" mb={4}>
            Profile Details
          </Heading>
          <div className="flex flex-col gap-6 items-center">
            <div className="relative w-32 h-32 group">
              <img
                src={imagePreview}
                alt="Profile"
                className="w-full h-full rounded-full object-cover border"
              />
              <div className="absolute inset-0 bg-black bg-opacity-50 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition">
                <label className="cursor-pointer">
                  <Camera color="white" size={24} />
                  <input
                    type="file"
                    accept="image/*"
                    {...register('profileImage')}
                    className="hidden"
                  />
                </label>
              </div>
            </div>
            <div className="w-full h-px bg-gray-300 my-2" />
            <div className="flex flex-col text-sm gap-2 w-full">
              <div className="flex gap-2">
                <strong className="w-32">Full Name:</strong>
                <span>{getValues('name')}</span>
              </div>
              <div className="flex gap-2">
                <strong className="w-32">Email:</strong>
                <span>{getValues('email')}</span>
              </div>
              <div className="flex gap-2">
                <strong className="w-32">Academic Year:</strong>
                <span>{getValues('academicYear')}</span>
              </div>
              <div className="flex gap-2">
                <strong className="w-32">Bio:</strong>
                <span>{getValues('bio')}</span>
              </div>
            </div>
          </div>
        </div>

        <div className="w-2/3 p-6 bg-gray-50">
          <Heading size="md" fontFamily="Roboto" mb={4}>
            Update Profile
          </Heading>
          <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
            <div className="flex flex-col gap-1">
              <Text className="text-sm font-medium text-gray-700 flex items-center gap-1">
                <UserIcon size={14} /> Full Name
              </Text>
              <Input {...register('name')} size="sm" disabled={loading || saving} />
            </div>

            <div className="flex flex-col gap-1">
              <Text className="text-sm font-medium text-gray-700 flex items-center gap-1">
                <Mail size={14} /> Email
              </Text>
              <Input {...register('email')} type="email" size="sm" disabled={loading || saving} />
            </div>

            <div className="flex flex-col gap-1">
              <Text className="text-sm font-medium text-gray-700 flex items-center gap-1">
                <GraduationCap size={14} /> Academic Year
              </Text>
              <select
                {...register('academicYear')}
                className="border border-gray-300 rounded px-3 py-1 text-sm"
                disabled={loading || saving}
              >
                {academicYears.map((year) => (
                  <option key={year} value={year}>{year}</option>
                ))}
              </select>
            </div>

            <div className="flex flex-col gap-1">
              <Text className="text-sm font-medium text-gray-700 flex items-center gap-1">
                <Info size={14} /> Bio
              </Text>
              <Textarea {...register('bio')} placeholder="Tell us about yourself..." size="sm" disabled={loading || saving} />
            </div>

            <div className="flex flex-col gap-1">
              <Text className="text-sm font-medium text-gray-700 flex items-center gap-1">
                <Lock size={14} /> Password
              </Text>
              <Input {...register('password')} type="password" placeholder="********" size="sm" disabled={loading || saving} />
              <span className="text-[11px] text-gray-500">Leave blank to keep your current password.</span>
            </div>

            <CButton
              type="submit"
              size="sm"
              borderRadius="md"
              bg="gray.500"
              color="white"
              _hover={{ bg: 'gray.600' }}
              fontFamily="Roboto"
              disabled={loading || saving}
            >
              <Upload size={16} style={{ marginRight: '8px' }} />
              {saving ? 'Updating…' : 'Update Profile'}
            </CButton>
          </form>
        </div>
      </div>
    </div>
  );
};

export default ManagerProfilePage;
