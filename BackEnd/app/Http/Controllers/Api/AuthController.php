<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\Api\LoginRequest;
use App\Http\Requests\Api\RegisterRequest;
use App\Models\Role;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\ValidationException;

class AuthController extends Controller
{
    /**
     * Create an account and sign the user straight in.
     */
    public function register(RegisterRequest $request): JsonResponse
    {
        $user = DB::transaction(function () use ($request) {
            $user = User::create([
                'username' => $request->string('username')->toString(),
                'email' => $request->string('email')->toString(),
                'password' => $request->string('password')->toString(),
                'locale' => 'id',
                'status' => User::STATUS_ACTIVE,
            ]);

            // Everyone starts as a customer; becoming a seller happens later
            // when a store is opened.
            $customer = Role::where('name', Role::CUSTOMER)->firstOrFail();
            $user->roles()->attach($customer->id);

            return $user;
        });

        return $this->tokenResponse($user, 'Akun berhasil dibuat.', 201);
    }

    /**
     * Sign in with either a username or an email address.
     */
    public function login(LoginRequest $request): JsonResponse
    {
        $identifier = $request->string('identifier')->toString();

        $user = User::where('username', $identifier)
            ->orWhere('email', $identifier)
            ->first();

        if (! $user || ! Hash::check($request->string('password')->toString(), $user->password)) {
            // One message for both cases so the form cannot be used to probe
            // which usernames exist.
            throw ValidationException::withMessages([
                'identifier' => 'Username/email atau password salah.',
            ]);
        }

        if (! $user->isActive()) {
            throw ValidationException::withMessages([
                'identifier' => 'Akun ini sedang tidak aktif. Hubungi dukungan UMKMify.',
            ]);
        }

        return $this->tokenResponse($user, 'Berhasil masuk.');
    }

    /**
     * Revoke the token used for the current request.
     */
    public function logout(Request $request): JsonResponse
    {
        $request->user()->currentAccessToken()->delete();

        return response()->json(['message' => 'Berhasil keluar.']);
    }

    /**
     * The signed-in user, with roles.
     */
    public function me(Request $request): JsonResponse
    {
        return response()->json([
            'user' => $this->userPayload($request->user()),
        ]);
    }

    private function tokenResponse(User $user, string $message, int $status = 200): JsonResponse
    {
        return response()->json([
            'message' => $message,
            'token' => $user->createToken('umkmify-spa')->plainTextToken,
            'user' => $this->userPayload($user),
        ], $status);
    }

    /**
     * @return array<string, mixed>
     */
    private function userPayload(User $user): array
    {
        $user->loadMissing('roles');

        return [
            'id' => $user->id,
            'username' => $user->username,
            'email' => $user->email,
            'locale' => $user->locale,
            'status' => $user->status,
            'roles' => $user->roles->pluck('name')->all(),
        ];
    }
}
