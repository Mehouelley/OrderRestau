<?php

namespace App\Services;

use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Http;

class CloudinaryService
{
    public function enabled(): bool
    {
        return (bool) config('services.cloudinary.cloud_name')
            && (bool) config('services.cloudinary.api_key')
            && (bool) config('services.cloudinary.api_secret');
    }

    public function uploadImage(UploadedFile $file, string $folder): ?array
    {
        if (! $this->enabled()) {
            return null;
        }

        $cloudName = config('services.cloudinary.cloud_name');
        $apiKey = config('services.cloudinary.api_key');
        $apiSecret = config('services.cloudinary.api_secret');

        if (! is_string($cloudName) || ! is_string($apiKey) || ! is_string($apiSecret) || $cloudName === '' || $apiKey === '' || $apiSecret === '') {
            return null;
        }

        $timestamp = time();
        $folder = trim($folder, '/');

        $params = [
            'folder' => $folder,
            'timestamp' => $timestamp,
        ];

        $signature = $this->sign($params, $apiSecret);

        $response = Http::attach(
            'file',
            fopen($file->getRealPath(), 'r'),
            $file->getClientOriginalName()
        )->post("https://api.cloudinary.com/v1_1/{$cloudName}/image/upload", [
            'api_key' => $apiKey,
            'folder' => $folder,
            'timestamp' => $timestamp,
            'signature' => $signature,
        ]);

        if (! $response->successful()) {
            return null;
        }

        $json = $response->json();

        if (! is_array($json) || empty($json['secure_url'])) {
            return null;
        }

        return [
            'url' => $json['secure_url'],
            'public_id' => $json['public_id'] ?? null,
        ];
    }

    public function destroyByUrl(?string $url): void
    {
        if (! $url || ! $this->enabled() || ! $this->isCloudinaryUrl($url)) {
            return;
        }

        $publicId = $this->publicIdFromUrl($url);

        if (! $publicId) {
            return;
        }

        $cloudName = config('services.cloudinary.cloud_name');
        $apiKey = config('services.cloudinary.api_key');
        $apiSecret = config('services.cloudinary.api_secret');

        if (! is_string($cloudName) || ! is_string($apiKey) || ! is_string($apiSecret) || $cloudName === '' || $apiKey === '' || $apiSecret === '') {
            return;
        }

        $timestamp = time();

        $params = [
            'invalidate' => true,
            'public_id' => $publicId,
            'timestamp' => $timestamp,
        ];

        $signature = $this->sign($params, $apiSecret);

        Http::asForm()->post("https://api.cloudinary.com/v1_1/{$cloudName}/image/destroy", [
            'api_key' => $apiKey,
            'public_id' => $publicId,
            'invalidate' => true,
            'timestamp' => $timestamp,
            'signature' => $signature,
        ]);
    }

    public function isCloudinaryUrl(?string $value): bool
    {
        return is_string($value) && str_contains($value, 'cloudinary.com/');
    }

    private function publicIdFromUrl(string $url): ?string
    {
        if (! preg_match('~cloudinary\.com/.+/image/upload/(?:v\d+/)?(.+)\.[^.]+$~', $url, $matches)) {
            return null;
        }

        return $matches[1] ?? null;
    }

    private function sign(array $params, string $secret): string
    {
        ksort($params);

        $query = collect($params)
            ->filter(fn ($value) => $value !== null && $value !== '')
            ->map(fn ($value, $key) => $key . '=' . (is_bool($value) ? ($value ? 'true' : 'false') : $value))
            ->implode('&');

        return sha1($query . $secret);
    }
}