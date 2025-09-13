import {
  Button,
  Dialog,
  Field,
  Input,
  Portal,
  Stack,
  Textarea,
  UseDisclosureProps
} from "@chakra-ui/react";
import { useEffect, useRef, useState } from "react";

type NewProjectDialogPageProps = {
  disclosure: UseDisclosureProps;
  onProjectCreated: () => void;
};

const NewProjectDialogPage = ({ disclosure, onProjectCreated }: NewProjectDialogPageProps) => {
  const ref = useRef<HTMLInputElement>(null);

  const [title, setTitle] = useState('');
  const [desc, setDesc] = useState('');
  const [startDate, setStartDate] = useState(''); // YYYY-MM-DD
  const [endDate, setEndDate] = useState('');     // YYYY-MM-DD

  const [isLoading, setIsLoading] = useState(false);
  const [err, setErr] = useState('');

  // focus title when dialog opens + reset fields when closing
  useEffect(() => {
    if (disclosure.open) {
      setTimeout(() => ref.current?.focus(), 50);
    } else {
      setTitle('');
      setDesc('');
      setStartDate('');
      setEndDate('');
      setErr('');
    }
  }, [disclosure.open]);

  const validate = () => {
    const t = title.trim();
    if (!t) return 'Project title is required';
    if (!startDate) return 'Start date is required';
    if (!endDate) return 'End date is required';
    if (new Date(startDate) > new Date(endDate)) return 'End date must be on or after the start date';
    return '';
  };

  const handleCreate = async () => {
    const v = validate();
    if (v) { setErr(v); return; }

    setErr('');
    setIsLoading(true);

    try {
      const res = await fetch(
        `${import.meta.env.VITE_BASE_URL}/api/manager/projects/create.php`, // ✅ point to create.php
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify({
            title: title.trim(),
            description: desc.trim() || null,
            start_date: startDate,
            end_date: endDate
          })
        }
      );

      const text = await res.text();
      let result: any;
      try {
        result = JSON.parse(text);
      } catch {
        console.error('Non-JSON response from API (create project):\n', text);
        throw new Error('API did not return JSON');
      }

      if (result.success) {
        setTitle('');
        setDesc('');
        setStartDate('');
        setEndDate('');
        disclosure.onClose?.();
        onProjectCreated();
      } else {
        setErr(result.message || 'Failed to create project.');
      }
    } catch (e) {
      console.error('Create project error:', e);
      setErr('Server error while creating project.');
    } finally {
      setIsLoading(false);
    }
  };

  const datesValid = startDate && endDate && new Date(startDate) <= new Date(endDate);
  const canSave = title.trim().length > 0 && datesValid && !isLoading;

  return (
    <div>
      <Dialog.Root open={disclosure.open} onOpenChange={disclosure.onClose}>
        <Portal>
          <Dialog.Backdrop />
          <Dialog.Positioner>
            <Dialog.Content>
              <Dialog.Header>
                <Dialog.Title>Create New Project</Dialog.Title>
              </Dialog.Header>

              <Dialog.Body pb="4">
                <Stack gap="4">
                  <Field.Root>
                    <Field.Label>Project Title</Field.Label>
                    <Input
                      ref={ref}
                      className="border pl-2"
                      placeholder="Enter project title"
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}
                    />
                  </Field.Root>

                  <Field.Root>
                    <Field.Label>Description</Field.Label>
                    <Textarea
                      className="border pl-2"
                      placeholder="Optional description"
                      value={desc}
                      onChange={(e) => setDesc(e.target.value)}
                    />
                  </Field.Root>

                  <Field.Root>
                    <Field.Label>Start Date</Field.Label>
                    <Input
                      type="date"
                      className="border pl-2"
                      value={startDate}
                      onChange={(e) => setStartDate(e.target.value)}
                    />
                  </Field.Root>

                  <Field.Root>
                    <Field.Label>End Date</Field.Label>
                    <Input
                      type="date"
                      className="border pl-2"
                      value={endDate}
                      min={startDate || undefined}
                      onChange={(e) => setEndDate(e.target.value)}
                    />
                  </Field.Root>

                  {err && (
                    <div className="text-sm text-red-600">{err}</div>
                  )}
                </Stack>
              </Dialog.Body>

              <Dialog.Footer>
                <Dialog.ActionTrigger asChild>
                  <Button variant="outline">Cancel</Button>
                </Dialog.ActionTrigger>
                <Button
                  onClick={handleCreate}
                  loading={isLoading}      // keep `loading` to match your setup
                  disabled={!canSave}
                  colorScheme="green"
                >
                  Save
                </Button>
              </Dialog.Footer>
            </Dialog.Content>
          </Dialog.Positioner>
        </Portal>
      </Dialog.Root>
    </div>
  );
};

export default NewProjectDialogPage;
