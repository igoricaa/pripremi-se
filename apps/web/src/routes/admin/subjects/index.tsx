import { Suspense, useState } from 'react';
import { createFileRoute, Link } from '@tanstack/react-router';
import { useMutation } from 'convex/react';
import { useSuspenseQuery } from '@tanstack/react-query';
import { Plus } from 'lucide-react';
import { toast } from 'sonner';

import { api } from '@pripremi-se/backend/convex/_generated/api';
import { convexQuery } from '@/lib/convex';
import { CardWithTableSkeleton } from '@/components/admin/skeletons';
import { Button } from '@/components/ui/button';
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from '@/components/ui/card';
import { DataTable } from '@/components/ui/data-table';
import { getSubjectColumns } from './columns';
import { DeleteConfirmDialog } from '@/components/admin/DeleteConfirmDialog';
import { DELETE_MESSAGES } from '@/lib/constants/admin-ui';

export const Route = createFileRoute('/admin/subjects/')({
	loader: async ({ context }) => {
		if (typeof window === 'undefined') return;

		context.queryClient.prefetchQuery(
			convexQuery(api.subjects.listSubjects, {})
		);
	},
	component: SubjectsPage,
});

function SubjectsPage() {
	const [deleteId, setDeleteId] = useState<string | null>(null);
	const deleteSubject = useMutation(
		api.subjects.deleteSubject
	).withOptimisticUpdate((localStore, args) => {
		const current = localStore.getQuery(api.subjects.listSubjects, {});
		if (current === undefined) return;
		const updated = current.filter((item) => item._id !== args.id);
		localStore.setQuery(api.subjects.listSubjects, {}, updated);
		toast.success('Subject deleted successfully');
	});

	const handleDelete = async () => {
		if (!deleteId) return;

		const idToDelete = deleteId;
		setDeleteId(null);

		try {
			await deleteSubject({ id: idToDelete });
		} catch (error) {
			toast.error(
				error instanceof Error ? error.message : 'Failed to delete subject'
			);
		}
	};

	return (
		<div className="space-y-6">
			<div className="flex items-center justify-between">
				<div>
					<h1 className="font-bold text-3xl tracking-tight">Subjects</h1>
					<p className="text-muted-foreground">Manage curriculum subjects</p>
				</div>
				<Button asChild>
					<Link to="/admin/subjects/new">
						<Plus className="mr-2 h-4 w-4" />
						Add Subject
					</Link>
				</Button>
			</div>

			<Suspense fallback={<CardWithTableSkeleton preset="subjects" rows={20} />}>
				<SubjectsCard onDeleteRequest={(id) => setDeleteId(id)} />
			</Suspense>

			<DeleteConfirmDialog
				open={!!deleteId}
				onOpenChange={() => setDeleteId(null)}
				onConfirm={handleDelete}
				title={DELETE_MESSAGES.subject.title}
				description={DELETE_MESSAGES.subject.description}
			/>
		</div>
	);
}

function SubjectsCard({ onDeleteRequest }: { onDeleteRequest: (id: string) => void }) {
	const { data: subjects } = useSuspenseQuery(
		convexQuery(api.subjects.listSubjects, {})
	);

	const columns = getSubjectColumns({ onDelete: onDeleteRequest });

	return (
		<Card>
			<CardHeader>
				<CardTitle>All Subjects</CardTitle>
				<CardDescription>
					{subjects.length} subject{subjects.length !== 1 ? 's' : ''} total
				</CardDescription>
			</CardHeader>
			<CardContent>
				<DataTable
					columns={columns}
					data={subjects}
					defaultPageSize={20}
				/>
			</CardContent>
		</Card>
	);
}
