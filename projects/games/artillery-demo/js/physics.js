export function createProjectile(shooter, angleDegrees, power) {
    const radians = angleDegrees * Math.PI / 180;
    const speed = power * 5.1;

    return {
        x: shooter.x + shooter.facing * 34,
        y: shooter.y - 26,
        vx: Math.cos(radians) * speed * shooter.facing,
        vy: -Math.sin(radians) * speed,
        flightTime: 0,
        shooterId: shooter.id,
        radius: 7
    };
}

export function updateProjectile(projectile, dt, world) {
    projectile.flightTime += dt;
    projectile.vx += world.wind * dt;
    projectile.vy += world.gravity * dt;
    projectile.x += projectile.vx * dt;
    projectile.y += projectile.vy * dt;
}

export function distance(aX, aY, bX, bY) {
    return Math.hypot(aX - bX, aY - bY);
}

export function isProjectileOut(projectile, world) {
    return (
        projectile.x < -80 ||
        projectile.x > world.width + 80 ||
        projectile.y > world.height + 100 ||
        projectile.flightTime > 9
    );
}
