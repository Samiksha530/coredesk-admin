import { Injectable, inject, signal } from '@angular/core';
import { HttpClient, HttpInterceptorFn } from '@angular/common/http';
import { CanActivateFn, Router } from '@angular/router';
import { tap } from 'rxjs';
export type Role='Admin'|'Manager'|'Viewer';
export interface User {id:string;name:string;email:string;role:Role;status:string;department:string;joined:string}
export interface Session {name:string;email:string;role:Role;token:string}
@Injectable({providedIn:'root'}) export class Api {
 private http=inject(HttpClient); private router=inject(Router);
 session=signal<Session|null>(this.restore());
 private restore(){try{return JSON.parse(sessionStorage.getItem('coredesk-session')||'null');}catch{return null;}}
 login(email:string,password:string){return this.http.post<Session>('/api/auth/login',{email,password}).pipe(tap(s=>{this.session.set(s);sessionStorage.setItem('coredesk-session',JSON.stringify(s));}));}
 logout(){this.session.set(null);sessionStorage.removeItem('coredesk-session');this.router.navigateByUrl('/login');}
 users(){return this.http.get<User[]>('/api/users');}
 save(u:Partial<User>){return u.id?this.http.put<User>('/api/users/'+u.id,u):this.http.post<User>('/api/users',u);}
 remove(id:string){return this.http.delete('/api/users/'+id);}
 analytics(period:string){return this.http.get<{revenue:number;customers:number;conversion:number;growth:number;series:number[]}>('/api/analytics',{params:{period}});}
 audit(){return this.http.get<{id:string;action:string;actor:string;date:string}[]>('/api/audit');}
}
export const authGuard:CanActivateFn=()=>inject(Api).session()?true:inject(Router).createUrlTree(['/login']);
export const adminGuard:CanActivateFn=()=>inject(Api).session()?.role==='Admin'?true:inject(Router).createUrlTree(['/dashboard']);
export const authInterceptor:HttpInterceptorFn=(req,next)=>{const api=inject(Api);const token=api.session()?.token;return next(token&&req.url.startsWith('/api/')?req.clone({setHeaders:{Authorization:`Bearer ${token}`}}):req);};
