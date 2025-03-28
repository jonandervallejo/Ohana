<x-mail::message>
<div style="font-family: 'Helvetica Neue', Arial, sans-serif; max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 8px; box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1); overflow: hidden;">
    <!-- Header with gradient background -->
    <div style="background: linear-gradient(135deg, #6366F1 0%, #4F46E5 100%); padding: 30px 25px; text-align: center;">
        <img src="{{ asset('logo.png') }}" alt="{{ config('app.name') }}" style="max-height: 60px; margin: 0 auto;">
    </div>

    <div style="padding: 40px 30px;">
        <!-- Saludo with enhanced typography -->
        <h1 style="color: #1E293B; font-size: 26px; font-weight: 700; margin-top: 0; margin-bottom: 25px; text-align: center; line-height: 1.4;">
            @if (! empty($greeting))
                {{ $greeting }}
            @else
                @if ($level === 'error')
                    @lang('¡Ups!')
                @else
                    @lang('¡Hola!')
                @endif
            @endif
        </h1>

        <!-- Introducción -->
        <div style="color: #4B5563; font-size: 17px; line-height: 1.7; margin-bottom: 25px; text-align: left;">
            @foreach ($introLines as $line)
                <p style="margin: 12px 0;">{{ $line }}</p>
            @endforeach
        </div>

        <!-- Acción -->
        @isset($actionText)
        <?php
            $color = match ($level) {
                'success' => '#10B981',
                'error' => '#EF4444',
                default => '#4F46E5',
            };
        ?>
        <div style="text-align: center; margin: 35px 0;">
            <a href="{{ $actionUrl }}" 
               style="display: inline-block; background-color: {{ $color }}; color: #ffffff; padding: 14px 28px; text-decoration: none; border-radius: 8px; font-size: 18px; font-weight: 600; transition: all 0.2s ease;">
                {{ $actionText }}
            </a>
        </div>
        @endisset

        <!-- Cierre -->
        <div style="color: #4B5563; font-size: 17px; line-height: 1.7; margin-bottom: 25px; text-align: left;">
            @foreach ($outroLines as $line)
                <p style="margin: 12px 0;">{{ $line }}</p>
            @endforeach
        </div>

        <!-- Despedida -->
        <div style="color: #6B7280; font-size: 17px; margin-top: 35px; border-top: 1px solid #E5E7EB; padding-top: 20px;">
            @if (! empty($salutation))
                <p>{{ $salutation }}</p>
            @else
                <p>@lang('Saludos,')<br><strong>{{ config('app.name') }}</strong></p>
            @endif
        </div>
    </div>

    <!-- Footer -->
    <div style="background-color: #F3F4F6; padding: 25px 20px; text-align: center; font-size: 14px; color: #6B7280;">
        <!-- Subcopia -->
        @isset($actionText)
        <p style="margin-bottom: 18px; font-size: 13px; line-height: 1.5;">
            @lang(
                "Si tienes problemas para hacer clic en el botón \":actionText\", copia y pega la URL a continuación\n". 
                'en tu navegador web:',
                [
                    'actionText' => $actionText,
                ]
            )
            <br>
            <a href="{{ $actionUrl }}" style="color: #4F46E5; word-break: break-all;">{{ $displayableActionUrl }}</a>
        </p>
        @endisset

        <p style="margin-top: 10px; margin-bottom: 0;">
            &copy; {{ date('Y') }} {{ config('app.name') }}. Todos los derechos reservados.
        </p>
    </div>
</div>

{{-- We keep the original slots system for Laravel mail components compatibility --}}
@isset($actionText)
<x-slot:subcopy style="display:none;">
@lang(
    "Si tienes problemas para hacer clic en el botón \":actionText\", copia y pega la URL a continuación\n". 
    'en tu navegador web:',
    [
        'actionText' => $actionText,
    ]
) <span class="break-all">[{{ $displayableActionUrl }}]({{ $actionUrl }})</span>
</x-slot:subcopy>
@endisset
</x-mail::message>
