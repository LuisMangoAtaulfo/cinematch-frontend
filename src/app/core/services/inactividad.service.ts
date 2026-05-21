import { Injectable, NgZone, OnDestroy } from '@angular/core';
import { Subject, fromEvent, merge } from 'rxjs';
import { takeUntil, debounceTime } from 'rxjs/operators';

const TIMEOUT_MS  = 60_000;
const AVISO_MS    = 30_000; // avisa cuando quedan 30s

@Injectable({ providedIn: 'root' })
export class InactividadService implements OnDestroy {

    private timer:      ReturnType<typeof setTimeout> | null = null;
    private timerAviso: ReturnType<typeof setTimeout> | null = null;
    private readonly _inactivo$ = new Subject<void>();
    private readonly _aviso$    = new Subject<boolean>(); // true = mostrar, false = ocultar
    private readonly destroy$   = new Subject<void>();

    readonly inactivo$ = this._inactivo$.asObservable();
    readonly aviso$    = this._aviso$.asObservable();

    constructor(private ngZone: NgZone) {}

    iniciar(): void {
        this.detener();

        this.ngZone.runOutsideAngular(() => {
            merge(
                fromEvent(document, 'mousemove'),
                fromEvent(document, 'mousedown'),
                fromEvent(document, 'touchstart'),
                fromEvent(document, 'keydown'),
                fromEvent(document, 'scroll'),
            ).pipe(
                debounceTime(300),
                takeUntil(this.destroy$)
            ).subscribe(() => this.resetTimer());
        });

        this.resetTimer();
    }

    detener(): void {
        if (this.timer)      clearTimeout(this.timer);
        if (this.timerAviso) clearTimeout(this.timerAviso);
        this.timer      = null;
        this.timerAviso = null;
        this.destroy$.next();
        this._aviso$.next(false); // ocultar aviso si estaba visible
    }

    private resetTimer(): void {
        if (this.timer)      clearTimeout(this.timer);
        if (this.timerAviso) clearTimeout(this.timerAviso);

        // Ocultar aviso si el usuario volvió a tener actividad
        this.ngZone.run(() => this._aviso$.next(false));

        // Aviso a los 30s (quedan 30s)
        this.timerAviso = setTimeout(() => {
            this.ngZone.run(() => this._aviso$.next(true));
        }, TIMEOUT_MS - AVISO_MS);

        // Cierre al minuto
        this.timer = setTimeout(() => {
            this.ngZone.run(() => this._inactivo$.next());
        }, TIMEOUT_MS);
    }

    ngOnDestroy(): void {
        this.detener();
        this.destroy$.complete();
    }
}