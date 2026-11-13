import { ChangeDetectionStrategy, Component } from '@angular/core';
@Component({
  selector: 'app-roles',
  imports: [],
  templateUrl: './roles.component.html',
  styleUrl: './roles.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class RolesComponent {
  readonly roles = [
    {
      name: 'Admin',
      icon: '◇',
      description: 'Full workspace control, member lifecycle and access governance.',
    },
    {
      name: 'Manager',
      icon: '◈',
      description: 'Manage non-admin members and monitor business performance.',
    },
    {
      name: 'Viewer',
      icon: '◎',
      description: 'Read-only visibility into members, analytics and workspace activity.',
    },
  ];
  readonly permissions = [
    { name: 'View analytics and export reports', manager: true, viewer: true },
    { name: 'View members and audit log', manager: true, viewer: true },
    { name: 'Create and edit non-admin members', manager: true, viewer: false },
    { name: 'Manage admin members', manager: false, viewer: false },
    { name: 'Delete members', manager: false, viewer: false },
    { name: 'Access permission matrix', manager: false, viewer: false },
  ];
}
