'use client';
import { User } from "@prisma/client";
import React, { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";

export default function UserTable() {
    const searchParams = useSearchParams();
      const page = parseInt(searchParams.get("page") || "1");
    
      const [users, setUsers] = useState<User[]>([]);
      const [isLoading, setIsLoading] = useState(true);
    
      useEffect(() => {
        async function fetchUsers() {
          setIsLoading(true);
          try {
            const res = await fetch(`/api/users`);
    
            if (!res.ok) throw new Error("Failed to fetch users");
    
            const data = await res.json();
            setUsers(data.users);

          } catch (error) {
            console.error("Error fetching users:", error);
          } finally {
            setIsLoading(false);
          }
        }
    
        fetchUsers();
    
      }, [page]);

    const [filter, setFilter] = useState('');

    const filteredUsers = users.filter(user => user.name?.toLowerCase().includes(filter.toLowerCase()));

    return (
        <div className="relative overflow-x-auto bg-neutral-primary-soft shadow-xs rounded-base border border-default">
            <div className="p-10 flex justify-between">
                <label htmlFor="input-group-1" className="sr-only">Search</label>
                <div className="relative">
                    <div className="absolute inset-y-0 start-0 flex items-center ps-3 pointer-events-none">
                    </div>
                    <input onChange={(event) => setFilter(event.target.value)} type="text" id="input-group-1" className="block w-full max-w-96 ps-9 pe-3 py-2 bg-neutral-secondary-medium border border-default-medium text-heading text-sm rounded-base focus:ring-brand focus:border-brand px-3 py-2.5 shadow-xs placeholder:text-body" placeholder="Search" />
                </div>
                <button className="shrink-0 inline-flex items-center justify-center text-body bg-neutral-secondary-medium box-border border border-default-medium hover:bg-neutral-tertiary-medium hover:text-heading focus:ring-4 focus:ring-neutral-tertiary shadow-xs font-medium leading-5 rounded-base text-sm px-3 py-2 focus:outline-none" type="button">
                    <Link href="/users/create">Create User</Link>
                </button>
            </div>
            <div className="p-10">
                <table className="w-full text-sm text-left rtl:text-right text-body">
                    <thead className="text-sm text-body bg-neutral-secondary-medium border-b border-t border-default-medium">
                        <tr>
                            <th scope="col" className="p-4">
                                <div className="flex items-center">
                                    <input id="table-checkbox-12" type="checkbox" value="" className="w-4 h-4 border border-default-medium rounded-xs bg-neutral-secondary-medium focus:ring-2 focus:ring-brand-soft" />
                                    <label htmlFor="table-checkbox-12" className="sr-only">Table checkbox</label>
                                </div>
                            </th>
                            <th scope="col" className="px-6 py-3 font-medium">
                                Name
                            </th>
                            <th scope="col" className="px-6 py-3 font-medium">
                                Email
                            </th>
                            <th scope="col" className="px-6 py-3 font-medium">
                                Email Verified
                            </th>
                            <th scope="col" className="px-6 py-3 font-medium">
                                Created At
                            </th>
                            <th scope="col" className="px-6 py-3 font-medium">
                                Updated At
                            </th>
                        </tr>
                    </thead>
                    <tbody>
                        {filteredUsers.map(user => {
                            return (
                                <tr className="bg-neutral-primary-soft border-b border-default hover:bg-neutral-secondary-medium" key={user.id}>
                                    <td className="w-4 p-4">
                                        <div className="flex items-center">
                                            <input id="table-checkbox-13" type="checkbox" value="" className="w-4 h-4 border border-default-medium rounded-xs bg-neutral-secondary-medium focus:ring-2 focus:ring-brand-soft" />
                                            <label htmlFor="table-checkbox-13" className="sr-only">Table checkbox</label>
                                        </div>
                                    </td>
                                    <th scope="row" className="px-6 py-4 font-medium text-heading whitespace-nowrap">
                                    {user.name}
                                    </th>
                                    <td className="px-6 py-4">
                                        {user.email}
                                    </td>
                                    <td className="px-6 py-4">
                                    {new Date(user.emailVerified || '').toLocaleString()}
                                    </td>
                                    <td className="px-6 py-4">
                                        {new Date(user.createdAt).toLocaleString()}
                                    </td>
                                    <td className="px-6 py-4">
                                        {new Date(user.updatedAt).toLocaleString()}
                                    </td>
                                    <td className="px-1">
                                        <button className="shrink-0 inline-flex items-center justify-center text-body bg-neutral-secondary-medium box-border border border-default-medium hover:bg-neutral-tertiary-medium hover:text-heading focus:ring-4 focus:ring-neutral-tertiary shadow-xs font-medium leading-5 rounded-base text-sm px-3 py-2 focus:outline-none" type="button">
                                            <Link href={`/users/${user.id}/edit`}>Edit</Link>
                                        </button>
                                        
                                    </td>
                                    <td className="px-1">
                                        <button data-modal-target="popup-modal" data-modal-toggle="popup-modal" className="shrink-0 inline-flex items-center justify-center text-body bg-neutral-secondary-medium box-border border border-default-medium hover:bg-neutral-tertiary-medium hover:text-heading focus:ring-4 focus:ring-neutral-tertiary shadow-xs font-medium leading-5 rounded-base text-sm px-3 py-2 focus:outline-none" type="button">Delete</button>
                                        {/* <button className="shrink-0 inline-flex items-center justify-center text-body bg-neutral-secondary-medium box-border border border-default-medium hover:bg-neutral-tertiary-medium hover:text-heading focus:ring-4 focus:ring-neutral-tertiary shadow-xs font-medium leading-5 rounded-base text-sm px-3 py-2 focus:outline-none" type="button">
                                            <Link href={`/users/${user.id}/delete`}>Delete</Link>
                                        </button> */}
                                    </td>
                                </tr>
                            )
                        })}
                    </tbody>
                </table>
            </div>


            <div id="popup-modal" tabIndex={-1} className="hidden overflow-y-auto overflow-x-hidden fixed top-0 right-0 left-0 z-50 justify-center items-center w-full md:inset-0 h-[calc(100%-1rem)] max-h-full">
                <div className="relative p-4 w-full max-w-md max-h-full">
                    <div className="relative bg-neutral-primary-soft border border-default rounded-base shadow-sm p-4 md:p-6">
                            <button type="button" className="absolute top-3 end-2.5 text-body bg-transparent hover:bg-neutral-tertiary hover:text-heading rounded-base text-sm w-9 h-9 ms-auto inline-flex justify-center items-center" data-modal-hide="popup-modal">
                                <svg className="w-5 h-5" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="none" viewBox="0 0 24 24"><path stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18 17.94 6M18 18 6.06 6"/></svg>
                                <span className="sr-only">Close modal</span>
                            </button>
                        <div className="p-4 md:p-5 text-center">
                            <svg className="mx-auto mb-4 text-fg-disabled w-12 h-12" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="none" viewBox="0 0 24 24"><path stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 13V8m0 8h.01M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z"/></svg>
                            <h3 className="mb-6 text-body">Are you sure you want to delete this product from your account?</h3>
                            <div className="flex items-center space-x-4 justify-center">
                                <button data-modal-hide="popup-modal" type="button" className="text-white bg-danger box-border border border-transparent hover:bg-danger-strong focus:ring-4 focus:ring-danger-medium shadow-xs font-medium leading-5 rounded-base text-sm px-4 py-2.5 focus:outline-none">
                                Yes, I'm sure
                                </button>
                                <button data-modal-hide="popup-modal" type="button" className="text-body bg-neutral-secondary-medium box-border border border-default-medium hover:bg-neutral-tertiary-medium hover:text-heading focus:ring-4 focus:ring-neutral-tertiary shadow-xs font-medium leading-5 rounded-base text-sm px-4 py-2.5 focus:outline-none">No, cancel</button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

        </div>
        

    // <div className="relative overflow-x-auto bg-neutral-primary-soft shadow-xs rounded-base border border-default">
    //     <div className="p-4 flex justify-between">
    //         <label htmlFor="input-group-1" className="sr-only">Search</label>
    //         <div className="relative">
    //             <div className="absolute inset-y-0 start-0 flex items-center ps-3 pointer-events-none">
    //                 <svg className="w-4 h-4 text-body" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="none" viewBox="0 0 24 24"><path stroke="currentColor" stroke-linecap="round" stroke-width="2" d="m21 21-3.5-3.5M17 10a7 7 0 1 1-14 0 7 7 0 0 1 14 0Z"/></svg>
    //             </div>
    //             <input type="text" id="input-group-1" className="block w-full max-w-96 ps-9 pe-3 py-2 bg-neutral-secondary-medium border border-default-medium text-heading text-sm rounded-base focus:ring-brand focus:border-brand shadow-xs placeholder:text-body" placeholder="Search" />
    //         </div>
    //         <button id="dropdownDefaultButton" data-dropdown-toggle="dropdown" className="shrink-0 inline-flex items-center justify-center text-body bg-neutral-secondary-medium box-border border border-default-medium hover:bg-neutral-tertiary-medium hover:text-heading focus:ring-4 focus:ring-neutral-tertiary shadow-xs font-medium leading-5 rounded-base text-sm px-3 py-2 focus:outline-none" type="button">
    //             Filter by
    //         </button>
    //     </div>
    // </div>
    )
} 