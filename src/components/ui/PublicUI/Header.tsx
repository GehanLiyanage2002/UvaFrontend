import React, { useEffect, useState } from 'react';
import { Avatar, HStack, Stack, Text } from "@chakra-ui/react"
import { getAuth } from '../../../lib/api';

const users = [
    {
        id: "1",
        name: "K N P J Ananda",
        email: "iit22049@std.uwu.ac.lk",
        avatar: "https://i.pravatar.cc/300?u=iu",
    },
]

const Header = () => {
    const [loading, setLoading] = useState<boolean>(true);
    const [err, setErr] = useState<string>('');
    const [imagePreview, setImagePreview] = useState<string>('https://i.pravatar.cc/300?u=preview');
    const [userList, setUserList] = useState<any>({});

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
    
            setUserList(data.profile)
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
      }, []);

    return (
        <div className="px-6 py-4 top-0 sticky z-10 flex justify-end bg-gray-100 border-b items-center">
            <Stack gap="8" direction="row">
                {users.map((user) => (
                    <HStack key={user.email} gap="4" textStyle="sm">
                        <Avatar.Root>
                            <Avatar.Image src={imagePreview} />
                        </Avatar.Root>
                        <Stack gap="0" textAlign="right">
                            <Text fontWeight="medium">{userList.name}</Text>
                            <Text color="fg.muted" textStyle="xs">
                                {userList.email}
                            </Text>
                        </Stack>
                    </HStack>
                ))}
            </Stack>
        </div>
    );
};

export default Header;
