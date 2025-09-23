import React, { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import {
  Box,
  Button,
  Heading,
  Input,
  Textarea,
  Text,
} from '@chakra-ui/react';
import {
  Lock,
  Mail,
  User,
  Upload,
  Camera,
  GraduationCap,
  Info,
} from 'lucide-react';

type FormData = {
  name: string;
  email: string;
  password: string;
  academicYear: string;
  bio: string;
  profileImage: FileList;
};

const academicYears = ['1st Year', '2nd Year', '3rd Year', '4th Year'];

const CoordinatorProfilePage: React.FC = () => {
  const { register, handleSubmit, watch, getValues } = useForm<FormData>({
    defaultValues: {
      name: 'K N P J Ananda',
      email: 'iit22049@std.uwu.ac.lk',
      password: '',
      academicYear: '2nd Year',
      bio: 'I am a 2nd year student at UWU.',
    },
  });

  const [imagePreview, setImagePreview] = useState<string>('https://i.pravatar.cc/300?u=preview');
  const profileImage = watch('profileImage');

  useEffect(() => {
    if (profileImage && profileImage.length > 0) {
      const file = profileImage[0];
      const reader = new FileReader();
      reader.onloadend = () => setImagePreview(reader.result as string);
      reader.readAsDataURL(file);
    }
  }, [profileImage]);

  const onSubmit = (data: FormData) => {
    console.log('Updated profile:', data);
  };

  return (
    <div className="flex flex-col gap-6 pb-4">
      <div className="flex flex-col">
        <div className="font-bold text-3xl flex gap-2 items-center">
          <User size={30} />
          My Profile
        </div>
        <div className="text-xs text-gray-600 ml-8 mt-1">
          Keep your profile up-to-date and personalize your workspace
        </div>
      </div>
      <div className="flex border rounded-md overflow-hidden">
        <div className="w-1/3 p-6 bg-white border-r">
          <Heading size="md" fontFamily="Roboto" mb={4}>Profile Details</Heading>
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
          <Heading size="md" fontFamily="Roboto" mb={4}>Update Profile</Heading>
          <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
            <div className="flex flex-col gap-1">
              <Text className="text-sm font-medium text-gray-700 flex items-center gap-1">
                <User size={14} /> Full Name
              </Text>
              <Input {...register('name')} size="sm" />
            </div>
            <div className="flex flex-col gap-1">
              <Text className="text-sm font-medium text-gray-700 flex items-center gap-1">
                <Mail size={14} /> Email
              </Text>
              <Input {...register('email')} type="email" size="sm" />
            </div>
            <div className="flex flex-col gap-1">
              <Text className="text-sm font-medium text-gray-700 flex items-center gap-1">
                <GraduationCap size={14} /> Academic Year
              </Text>
              <select
                {...register('academicYear')}
                className="border border-gray-300 rounded px-3 py-1 text-sm"
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
              <Textarea {...register('bio')} placeholder="Tell us about yourself..." size="sm" />
            </div>
            <div className="flex flex-col gap-1">
              <Text className="text-sm font-medium text-gray-700 flex items-center gap-1">
                <Lock size={14} /> Password
              </Text>
              <Input {...register('password')} type="password" placeholder="********" size="sm" />
            </div>
            <Button
              type="submit"
              size="sm"
              borderRadius="md"
              arrow-back={<Upload size={16} />}
              bg="gray.500"
              color="white"
              _hover={{ bg: 'gray.600' }}
              fontFamily="Roboto"
            >
              Update Profile
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default CoordinatorProfilePage;